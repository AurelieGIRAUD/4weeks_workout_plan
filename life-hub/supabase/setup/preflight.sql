-- Run in the SQL Editor BEFORE the migration when adding Life Hub to an
-- existing project. Read-only. Every check should say 'ok'.

select 'tables' as check,
       coalesce('already exists: ' || string_agg(table_name, ', '), 'ok') as result
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'lists', 'list_members', 'list_invites', 'list_items', 'workouts',
                     'treatments', 'treatment_logs', 'push_subscriptions', 'ai_insights', 'treatment_status')
union all
select 'types', coalesce('already exists: ' || string_agg(typname, ', '), 'ok')
from pg_type t join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public' and typname = 'list_type'
union all
select 'triggers on auth.users', coalesce('already exists: ' || string_agg(tgname, ', '), 'ok')
from pg_trigger
where tgrelid = 'auth.users'::regclass and tgname in ('on_auth_user_created', 'on_auth_user_email_changed')
union all
select 'existing accounts', count(*)::text || ' (they get a profile and default lists from the migration)'
from auth.users;
