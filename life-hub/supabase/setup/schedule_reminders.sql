-- Run once in the Supabase SQL editor AFTER deploying the Edge Functions.
-- Calls send-reminders every hour at :05. The function only notifies users
-- whose local time has reached their reminder hour, once per day.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1) Store the project URL and the cron secret in Vault (replace the values).
--    CRON_SECRET must match the secret you set for the Edge Functions.
select vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'life_hub_project_url');
select vault.create_secret('YOUR-CRON-SECRET', 'life_hub_cron_secret');

-- 2) Schedule the job.
select cron.schedule(
  'life-hub-reminders',
  '5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'life_hub_project_url')
           || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'life_hub_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Check runs:   select * from cron.job_run_details order by start_time desc limit 10;
-- Unschedule:   select cron.unschedule('life-hub-reminders');
