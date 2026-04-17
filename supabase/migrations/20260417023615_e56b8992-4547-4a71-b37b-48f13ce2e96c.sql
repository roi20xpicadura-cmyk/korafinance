ALTER TABLE public.whatsapp_context
  ADD COLUMN IF NOT EXISTS pending_transactions jsonb,
  ADD COLUMN IF NOT EXISTS pending_confirmation boolean DEFAULT false;