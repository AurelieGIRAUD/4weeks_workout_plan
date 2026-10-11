-- =============================================================================
-- Life Hub — initial schema
-- Private by default. Lists can be shared with specific users; workouts and
-- beauty care are always private. RLS is enabled on every table.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

-- -----------------------------------------------------------------------------
-- Profiles
-- -----------------------------------------------------------------------------

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text not null,
  display_name      text check (char_length(display_name) <= 60),
  timezone          text not null default 'UTC' check (public.is_valid_timezone(timezone)),
  reminder_hour     smallint not null default 9 check (reminder_hour between 0 and 23),
  -- { "<list_type>": "<list_id>" } — which list quick-add uses for each type.
  quick_add_targets jsonb not null default '{}'::jsonb,
  -- Reserved for later AI features (opt-ins, tone, language…).
  ai_prefs          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index profiles_email_key on public.profiles (lower(email));

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Lists
-- -----------------------------------------------------------------------------

create type public.list_type as enum ('want_to_buy', 'need_to_buy', 'chores', 'todo', 'ideas');

create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type        public.list_type not null,
  name        text not null check (char_length(name) between 1 and 80),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index lists_one_default_per_type on public.lists (owner_id, type) where is_default;
create index lists_owner_idx on public.lists (owner_id);

create trigger lists_updated_at before update on public.lists
  for each row execute function public.set_updated_at();

create table public.list_members (
  list_id     uuid not null references public.lists (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  added_by    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index list_members_user_idx on public.list_members (user_id);

-- Shares sent to an email that has no account yet. They turn into memberships
-- when that person signs up (see handle_new_user).
create table public.list_invites (
  list_id     uuid not null references public.lists (id) on delete cascade,
  email       text not null check (email = lower(email) and email like '%_@_%'),
  invited_by  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (list_id, email)
);

create table public.list_items (
  id                     uuid primary key default gen_random_uuid(),
  list_id                uuid not null references public.lists (id) on delete cascade,
  created_by             uuid default auth.uid() references public.profiles (id) on delete set null,
  title                  text not null check (char_length(title) between 1 and 300),
  note                   text check (char_length(note) <= 2000),
  category               text check (char_length(category) <= 40),
  tags                   text[] not null default '{}',
  done                   boolean not null default false,
  done_at                timestamptz,
  done_by                uuid references public.profiles (id) on delete set null,
  archived_at            timestamptz,
  position               double precision,
  -- AI-ready columns (unused in v1)
  ai_suggested_category  text,
  ai_meta                jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index list_items_list_idx on public.list_items (list_id, archived_at, done);
create index list_items_tags_idx on public.list_items using gin (tags);

create trigger list_items_updated_at before update on public.list_items
  for each row execute function public.set_updated_at();

create or replace function public.list_items_track_done()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.done is distinct from old.done then
    if new.done then
      new.done_at := coalesce(new.done_at, now());
      new.done_by := coalesce(new.done_by, auth.uid());
    else
      new.done_at := null;
      new.done_by := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger list_items_done before insert or update on public.list_items
  for each row execute function public.list_items_track_done();

-- Access helpers. SECURITY DEFINER so policies can call them without
-- recursing through the RLS of lists/list_members.
create or replace function public.is_list_owner(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and l.owner_id = (select auth.uid())
  );
$$;

create or replace function public.has_list_access(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and l.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.list_members m
    where m.list_id = p_list_id and m.user_id = (select auth.uid())
  );
$$;

-- True when the caller and p_user_id are both on at least one common list.
create or replace function public.shares_list_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select id as list_id from public.lists where owner_id = (select auth.uid())
    union
    select list_id from public.list_members where user_id = (select auth.uid())
  ), theirs as (
    select id as list_id from public.lists where owner_id = p_user_id
    union
    select list_id from public.list_members where user_id = p_user_id
  )
  select exists (select 1 from mine join theirs using (list_id));
$$;

-- Share a list by email. Adds a member when the account exists, otherwise
-- stores a pending invite. Returns 'added', 'invited' or 'already'.
create or replace function public.share_list(p_list_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email   text := lower(trim(p_email));
  v_user_id uuid;
  v_count   int;
begin
  if not public.is_list_owner(p_list_id) then
    raise exception 'Only the list owner can share this list' using errcode = '42501';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email address' using errcode = '22023';
  end if;

  select id into v_user_id from public.profiles where lower(email) = v_email;

  if v_user_id = (select auth.uid()) then
    raise exception 'You already own this list' using errcode = '22023';
  end if;

  if v_user_id is not null then
    insert into public.list_members (list_id, user_id, added_by)
    values (p_list_id, v_user_id, (select auth.uid()))
    on conflict do nothing;
    get diagnostics v_count = row_count;
    return case when v_count = 0 then 'already' else 'added' end;
  end if;

  insert into public.list_invites (list_id, email, invited_by)
  values (p_list_id, v_email, (select auth.uid()))
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return case when v_count = 0 then 'already' else 'invited' end;
end;
$$;

-- -----------------------------------------------------------------------------
-- Workouts (private)
-- -----------------------------------------------------------------------------

create table public.workouts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  date           date not null default current_date,
  training_type  text not null check (training_type in
                   ('strength', 'cardio', 'yoga', 'pilates', 'hiit', 'mobility', 'sport', 'walk', 'other')),
  body_parts     text[] not null default '{}' check (body_parts <@ array[
                   'full_body', 'upper_body', 'lower_body', 'chest', 'back', 'shoulders',
                   'arms', 'core', 'glutes', 'legs']::text[]),
  duration_min   integer not null check (duration_min between 1 and 1440),
  notes          text check (char_length(notes) <= 2000),
  ai_meta        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index workouts_user_date_idx on public.workouts (user_id, date desc);

create trigger workouts_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Beauty care (private)
-- -----------------------------------------------------------------------------

create table public.treatments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 60),
  emoji             text not null default '✨' check (char_length(emoji) <= 16),
  interval_days     integer not null check (interval_days between 1 and 365),
  notes             text check (char_length(notes) <= 1000),
  active            boolean not null default true,
  remind            boolean not null default true,
  snoozed_until     date,
  last_notified_on  date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index treatments_user_idx on public.treatments (user_id);

create trigger treatments_updated_at before update on public.treatments
  for each row execute function public.set_updated_at();

create table public.treatment_logs (
  id            uuid primary key default gen_random_uuid(),
  treatment_id  uuid not null references public.treatments (id) on delete cascade,
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  done_on       date not null default current_date,
  note          text check (char_length(note) <= 1000),
  created_at    timestamptz not null default now()
);

create index treatment_logs_treatment_idx on public.treatment_logs (treatment_id, done_on desc);

-- Logging a treatment clears any snooze.
create or replace function public.treatment_logs_clear_snooze()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.treatments set snoozed_until = null
  where id = new.treatment_id and snoozed_until is not null;
  return new;
end;
$$;

create trigger treatment_logs_clear_snooze after insert on public.treatment_logs
  for each row execute function public.treatment_logs_clear_snooze();

-- Treatments with last/next dates. "Today" depends on the user's timezone, so
-- days_since / is_due are computed by the client (and by due_reminders()).
create view public.treatment_status
with (security_invoker = true)
as
select
  t.*,
  l.last_done,
  l.log_count,
  (l.last_done + t.interval_days) as next_due,
  case
    when l.last_done is null then null
    else greatest(l.last_done + t.interval_days, t.snoozed_until)
  end as effective_due
from public.treatments t
left join lateral (
  select max(done_on) as last_done, count(*)::int as log_count
  from public.treatment_logs tl
  where tl.treatment_id = t.id
) l on true;

-- -----------------------------------------------------------------------------
-- Web Push subscriptions (private)
-- -----------------------------------------------------------------------------

create table public.push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  endpoint         text not null unique,
  p256dh           text not null,
  auth             text not null,
  user_agent       text,
  created_at       timestamptz not null default now(),
  last_success_at  timestamptz
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- A device's endpoint is unique. If another account used this browser before,
-- the subscription moves to the caller.
create or replace function public.register_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth, p_user_agent)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent
  returning id;
$$;

-- -----------------------------------------------------------------------------
-- AI-ready: generated insights (written by a future Edge Function using the
-- service role; users can read and delete their own).
-- -----------------------------------------------------------------------------

create table public.ai_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  kind          text not null,  -- e.g. 'weekly_workout_summary', 'item_categorization'
  period_start  date,
  period_end    date,
  content       jsonb not null,
  model         text,
  created_at    timestamptz not null default now()
);

create index ai_insights_user_kind_idx on public.ai_insights (user_id, kind, period_start desc);

-- -----------------------------------------------------------------------------
-- New users: profile, default lists, pending invites → memberships
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(new.email);
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(v_email, new.id::text || '@unknown.invalid'));

  insert into public.lists (owner_id, type, name, is_default) values
    (new.id, 'want_to_buy', 'Want to Buy', true),
    (new.id, 'need_to_buy', 'Need to Buy', true),
    (new.id, 'chores',      'Chores',      true),
    (new.id, 'todo',        'To-Do',       true),
    (new.id, 'ideas',       'Ideas',       true);

  if v_email is not null then
    insert into public.list_members (list_id, user_id, added_by)
    select i.list_id, new.id, i.invited_by
    from public.list_invites i
    where i.email = v_email
    on conflict do nothing;

    delete from public.list_invites where email = v_email;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email and new.email is not null)
  execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Reminders (called by Edge Functions with the service role only)
-- -----------------------------------------------------------------------------

-- Treatments that should be notified now: due (or overdue) today in the user's
-- timezone, not snoozed, not yet notified today, and the user's local hour has
-- reached their reminder hour. Running hourly with ">=" means a missed cron
-- run still catches up later the same day.
create or replace function public.due_reminders()
returns table (
  user_id       uuid,
  treatment_id  uuid,
  name          text,
  emoji         text,
  effective_due date,
  local_today   date
)
language sql
stable
security definer
set search_path = ''
as $$
  select ts.user_id, ts.id, ts.name, ts.emoji, ts.effective_due,
         (now() at time zone p.timezone)::date as local_today
  from public.treatment_status ts
  join public.profiles p on p.id = ts.user_id
  where ts.active
    and ts.remind
    and ts.effective_due is not null
    and ts.effective_due <= (now() at time zone p.timezone)::date
    and (ts.last_notified_on is null or ts.last_notified_on < (now() at time zone p.timezone)::date)
    and extract(hour from now() at time zone p.timezone) >= p.reminder_hour
    and exists (select 1 from public.push_subscriptions s where s.user_id = ts.user_id);
$$;

create or replace function public.mark_reminded(p_treatment_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  update public.treatments t
  set last_notified_on = (now() at time zone p.timezone)::date
  from public.profiles p
  where p.id = t.user_id and t.id = any (p_treatment_ids);
$$;

-- Applies a notification action ('done' or 'snooze') for a user. The Edge
-- Function verifies the signed token before calling this.
create or replace function public.apply_reminder_action(
  p_user_id uuid, p_treatment_id uuid, p_action text, p_snooze_days int default 1
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date;
begin
  select (now() at time zone p.timezone)::date into v_today
  from public.treatments t join public.profiles p on p.id = t.user_id
  where t.id = p_treatment_id and t.user_id = p_user_id;

  if v_today is null then
    raise exception 'Treatment not found' using errcode = 'P0002';
  end if;

  if p_action = 'done' then
    insert into public.treatment_logs (treatment_id, user_id, done_on, note)
    values (p_treatment_id, p_user_id, v_today, 'Logged from notification');
    return 'done';
  elsif p_action = 'snooze' then
    update public.treatments
    set snoozed_until = v_today + greatest(1, least(p_snooze_days, 30)),
        last_notified_on = v_today
    where id = p_treatment_id;
    return 'snoozed';
  end if;

  raise exception 'Unknown action %', p_action using errcode = '22023';
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.lists              enable row level security;
alter table public.list_members       enable row level security;
alter table public.list_invites       enable row level security;
alter table public.list_items         enable row level security;
alter table public.workouts           enable row level security;
alter table public.treatments         enable row level security;
alter table public.treatment_logs     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.ai_insights        enable row level security;

-- profiles: see yourself and people you share a list with; edit yourself.
create policy "profiles: read self and co-members" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_list_with(id));

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may not change their own email or id through the API.
revoke update on public.profiles from authenticated;
grant update (display_name, timezone, reminder_hour, quick_add_targets, ai_prefs)
  on public.profiles to authenticated;

-- lists: owner and members read; only the owner writes.
create policy "lists: read if owner or member" on public.lists
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.has_list_access(id));

create policy "lists: owner inserts" on public.lists
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_default);

create policy "lists: owner updates" on public.lists
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "lists: owner deletes non-default" on public.lists
  for delete to authenticated
  using (owner_id = (select auth.uid()) and not is_default);

revoke update on public.lists from authenticated;
grant update (name) on public.lists to authenticated;

-- list_members: everyone on a list sees its members. Adding goes through
-- share_list(). The owner removes anyone; a member can leave.
create policy "list_members: read if on list" on public.list_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_list_access(list_id));

create policy "list_members: owner removes or member leaves" on public.list_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_list_owner(list_id));

-- list_invites: only the owner sees and cancels pending invites.
create policy "list_invites: owner reads" on public.list_invites
  for select to authenticated
  using (public.is_list_owner(list_id));

create policy "list_invites: owner deletes" on public.list_invites
  for delete to authenticated
  using (public.is_list_owner(list_id));

-- list_items: full access for anyone on the list.
create policy "list_items: read if on list" on public.list_items
  for select to authenticated
  using (public.has_list_access(list_id));

create policy "list_items: insert if on list" on public.list_items
  for insert to authenticated
  with check (public.has_list_access(list_id) and created_by = (select auth.uid()));

create policy "list_items: update if on list" on public.list_items
  for update to authenticated
  using (public.has_list_access(list_id))
  with check (public.has_list_access(list_id));

create policy "list_items: delete if on list" on public.list_items
  for delete to authenticated
  using (public.has_list_access(list_id));

-- Private tables: own rows only.
create policy "workouts: own rows" on public.workouts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "treatments: own rows" on public.treatments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "treatment_logs: own rows" on public.treatment_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.treatments t
      where t.id = treatment_id and t.user_id = (select auth.uid())
    )
  );

create policy "push_subscriptions: own rows" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "ai_insights: read own" on public.ai_insights
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "ai_insights: delete own" on public.ai_insights
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Function privileges
-- -----------------------------------------------------------------------------

revoke execute on function public.share_list(uuid, text) from public, anon;
grant execute on function public.share_list(uuid, text) to authenticated;

revoke execute on function public.register_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text) to authenticated;

revoke execute on function public.due_reminders() from public, anon, authenticated;
revoke execute on function public.mark_reminded(uuid[]) from public, anon, authenticated;
revoke execute on function public.apply_reminder_action(uuid, uuid, text, int) from public, anon, authenticated;
grant execute on function public.due_reminders() to service_role;
grant execute on function public.mark_reminded(uuid[]) to service_role;
grant execute on function public.apply_reminder_action(uuid, uuid, text, int) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime for shared lists
-- -----------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.lists, public.list_items, public.list_members;
  end if;
end;
$$;
