-- RLS and behaviour tests. Run with supabase/tests/run_local.sh.
-- Each DO block raises on failure, so ON_ERROR_STOP aborts the run.

\set alice '''11111111-1111-1111-1111-111111111111'''
\set bob   '''22222222-2222-2222-2222-222222222222'''
\set carol '''33333333-3333-3333-3333-333333333333'''
\set dave  '''44444444-4444-4444-4444-444444444444'''

insert into auth.users (id, email) values
  (:alice, 'Alice@Example.com'),
  (:bob,   'bob@example.com'),
  (:carol, 'carol@example.com');

-- ---------------------------------------------------------------- signup
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'profiles created on signup';
  assert (select email from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 'alice@example.com',
    'email is lower-cased';
  assert (select count(*) from public.lists where owner_id = '11111111-1111-1111-1111-111111111111' and is_default) = 5,
    'five default lists';
end $$;

-- ---------------------------------------------------------------- alice
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

do $$
declare v_list uuid;
begin
  assert (select count(*) from public.lists) = 5, 'alice sees only her 5 lists';
  assert (select count(*) from public.profiles) = 1, 'alice sees only her profile';

  select id into v_list from public.lists where type = 'need_to_buy';
  insert into public.list_items (list_id, title, tags, category) values (v_list, 'Milk', '{groceries}', 'food');
  insert into public.list_items (list_id, title, done) values (v_list, 'Eggs', true);
  assert (select done_at is not null and done_by = auth.uid() from public.list_items where title = 'Eggs'),
    'done_at / done_by tracked';

  insert into public.workouts (date, training_type, body_parts, duration_min)
  values (current_date, 'strength', '{glutes,legs}', 45);

  insert into public.treatments (name, interval_days) values ('Retinol', 3);
  insert into public.treatment_logs (treatment_id, done_on)
  select id, current_date - 4 from public.treatments where name = 'Retinol';
  assert (select next_due from public.treatment_status where name = 'Retinol') = current_date - 1,
    'next_due = last_done + interval';

  -- Cannot create a second default list, nor change email.
  begin
    insert into public.lists (type, name, is_default) values ('todo', 'Fake default', true);
    raise exception 'should not insert default list';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set email = 'hacker@example.com';
    raise exception 'should not update email';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set timezone = 'Europe/Paris', reminder_hour = 0;
  begin
    update public.profiles set timezone = 'Mars/Olympus';
    raise exception 'should reject invalid timezone';
  exception when check_violation then null;
  end;

  -- Default lists cannot be deleted.
  delete from public.lists where type = 'todo';
  assert (select count(*) from public.lists where type = 'todo') = 1, 'default list not deletable';

  -- Due reminders are service-role only.
  begin
    perform public.due_reminders();
    raise exception 'authenticated must not call due_reminders';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Share: bob has an account → added. dave doesn't → invited.
do $$
declare v_list uuid;
begin
  select id into v_list from public.lists where type = 'need_to_buy';
  assert public.share_list(v_list, ' BOB@example.com ') = 'added', 'bob added';
  assert public.share_list(v_list, 'bob@example.com') = 'already', 'bob already a member';
  assert public.share_list(v_list, 'dave@example.com') = 'invited', 'dave invited';
  assert (select count(*) from public.list_invites) = 1, 'owner sees invite';
  begin
    perform public.share_list(v_list, 'alice@example.com');
    raise exception 'cannot share with self';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- ---------------------------------------------------------------- bob
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';

do $$
declare v_list uuid;
begin
  assert (select count(*) from public.lists) = 6, 'bob sees his 5 + shared list';
  select id into v_list from public.lists where owner_id <> auth.uid();
  assert (select count(*) from public.list_items where list_id = v_list) = 2, 'bob sees shared items';
  assert (select count(*) from public.profiles) = 2, 'bob sees alice profile (co-member)';
  assert (select count(*) from public.list_members where list_id = v_list) = 1, 'bob sees members';
  assert (select count(*) from public.list_invites) = 0, 'bob does not see invites';

  insert into public.list_items (list_id, title) values (v_list, 'Bread');
  update public.list_items set done = true where title = 'Milk';
  assert (select done_by from public.list_items where title = 'Milk') = auth.uid(), 'bob ticked milk';

  update public.lists set name = 'Hijacked' where id = v_list;
  assert (select name from public.lists where id = v_list) = 'Need to Buy', 'member cannot rename';
  delete from public.lists where id = v_list;
  assert (select count(*) from public.lists where id = v_list) = 1, 'member cannot delete list';

  begin
    perform public.share_list(v_list, 'carol@example.com');
    raise exception 'member cannot re-share';
  exception when insufficient_privilege then null;
  end;

  -- Private data stays private.
  assert (select count(*) from public.workouts) = 0, 'bob cannot see alice workouts';
  assert (select count(*) from public.treatments) = 0, 'bob cannot see alice treatments';
  assert (select count(*) from public.treatment_status) = 0, 'view respects RLS';
  begin
    insert into public.workouts (user_id, training_type, duration_min)
    values ('11111111-1111-1111-1111-111111111111', 'cardio', 10);
    raise exception 'cannot insert workout for someone else';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------- carol
set request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333"}';

do $$
declare v_list uuid;
begin
  assert (select count(*) from public.lists) = 5, 'carol sees only her lists';
  assert (select count(*) from public.list_items) = 0, 'carol sees no items';
  assert (select count(*) from public.profiles) = 1, 'carol sees only herself';

  reset role;
  select id into v_list from public.lists
  where owner_id = '11111111-1111-1111-1111-111111111111' and type = 'need_to_buy';
  set role authenticated;

  begin
    insert into public.list_items (list_id, title) values (v_list, 'Sneaky');
    raise exception 'carol cannot insert into alice list';
  exception when insufficient_privilege then null;
  end;
  update public.list_items set title = 'pwned' where list_id = v_list;
  delete from public.list_items where list_id = v_list;
end $$;

reset role;
do $$ begin
  assert (select count(*) from public.list_items where title = 'pwned') = 0, 'carol update had no effect';
  assert (select count(*) from public.list_items) = 3, 'carol delete had no effect';
end $$;

-- ---------------------------------------------------------------- dave signs up → invite becomes membership
insert into auth.users (id, email) values (:dave, 'dave@example.com');
do $$ begin
  assert (select count(*) from public.list_members where user_id = '44444444-4444-4444-4444-444444444444') = 1,
    'invite converted to membership';
  assert (select count(*) from public.list_invites) = 0, 'invite consumed';
end $$;

-- ---------------------------------------------------------------- bob leaves
set role authenticated;
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
delete from public.list_members where user_id = auth.uid();
do $$ begin
  assert (select count(*) from public.lists) = 5, 'bob left the shared list';
  assert (select count(*) from public.list_items) = 0, 'bob no longer sees items';
end $$;

-- ---------------------------------------------------------------- anon sees nothing
set role anon;
reset request.jwt.claims;
do $$ begin
  assert (select count(*) from public.lists) = 0, 'anon sees no lists';
  assert (select count(*) from public.profiles) = 0, 'anon sees no profiles';
  assert (select count(*) from public.treatment_status) = 0, 'anon sees no treatments';
end $$;

-- ---------------------------------------------------------------- service role: reminders
reset role;
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
values ('11111111-1111-1111-1111-111111111111', 'https://push.example/abc', 'k', 'a');

set role service_role;
do $$
declare v_t uuid;
begin
  -- alice: reminder_hour 0 in Europe/Paris, Retinol overdue → due now.
  assert (select count(*) from public.due_reminders()) = 1, 'one reminder due';
  select treatment_id into v_t from public.due_reminders();
  perform public.mark_reminded(array[v_t]);
  assert (select count(*) from public.due_reminders()) = 0, 'not re-notified the same day';

  assert public.apply_reminder_action('11111111-1111-1111-1111-111111111111', v_t, 'snooze', 2) = 'snoozed', 'snooze';
  assert (select effective_due from public.treatment_status where id = v_t)
       = (now() at time zone 'Europe/Paris')::date + 2, 'snooze pushes effective_due';

  assert public.apply_reminder_action('11111111-1111-1111-1111-111111111111', v_t, 'done') = 'done', 'done';
  assert (select snoozed_until is null from public.treatments where id = v_t), 'logging clears snooze';
  assert (select log_count from public.treatment_status where id = v_t) = 2, 'log added';

  begin
    perform public.apply_reminder_action('22222222-2222-2222-2222-222222222222', v_t, 'done');
    raise exception 'wrong user must fail';
  exception when no_data_found then null;
  end;
end $$;
reset role;
