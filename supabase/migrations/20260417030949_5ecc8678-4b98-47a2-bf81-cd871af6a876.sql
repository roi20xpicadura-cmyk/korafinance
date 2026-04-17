ALTER TABLE public.whatsapp_connections
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.whatsapp_connections
ADD COLUMN IF NOT EXISTS last_notification_category TEXT;