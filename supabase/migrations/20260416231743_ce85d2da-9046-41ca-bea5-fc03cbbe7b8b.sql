CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if present
DO $$
BEGIN
  PERFORM cron.unschedule('monthly-financial-report');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule monthly report for the 1st of each month at 8am UTC
SELECT cron.schedule(
  'monthly-financial-report',
  '0 8 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://chkgnqrfrtovcpqwogeg.supabase.co/functions/v1/send-monthly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoa2ducXJmcnRvdmNwcXdvZ2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTI1MzMsImV4cCI6MjA5MTY4ODUzM30.qXWNcTH1DH0f83g8ZMf7CJRSF1prpPlU_jxwIQ91E2k'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);