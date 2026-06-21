create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname in (
      'worldcup-sync-matches-every-minute',
      'worldcup-recalculate-scores-every-2-minutes'
    )
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'worldcup-sync-matches-every-minute',
  '* * * * *',
  $$
    select
      net.http_post(
        url := 'https://henchknfussubmbcipzo.supabase.co/functions/v1/sync-matches',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
  $$
);

select cron.schedule(
  'worldcup-recalculate-scores-every-2-minutes',
  '*/2 * * * *',
  $$
    select
      net.http_post(
        url := 'https://henchknfussubmbcipzo.supabase.co/functions/v1/calculate-scores',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
  $$
);
