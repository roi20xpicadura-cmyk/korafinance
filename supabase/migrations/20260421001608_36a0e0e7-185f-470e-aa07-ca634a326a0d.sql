-- Remove duplicates first (keep oldest per user/type/date)
DELETE FROM public.prediction_alerts a
USING public.prediction_alerts b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.alert_type = b.alert_type
  AND a.triggered_date = b.triggered_date;

-- Add unique constraint to enforce dedup at DB level
ALTER TABLE public.prediction_alerts
  ADD CONSTRAINT prediction_alerts_user_type_date_unique
  UNIQUE (user_id, alert_type, triggered_date);