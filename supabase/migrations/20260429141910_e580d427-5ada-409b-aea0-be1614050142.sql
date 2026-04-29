
CREATE TABLE IF NOT EXISTS public.whatsapp_attachment_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trace_id UUID NOT NULL,
  user_id UUID,
  phone TEXT,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  attachment_kind TEXT,
  mime_type TEXT,
  file_bytes INTEGER,
  model TEXT,
  duration_ms INTEGER,
  transactions_found INTEGER,
  transactions_saved INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_attach_telemetry_trace ON public.whatsapp_attachment_telemetry(trace_id);
CREATE INDEX IF NOT EXISTS idx_wa_attach_telemetry_user ON public.whatsapp_attachment_telemetry(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_attach_telemetry_stage ON public.whatsapp_attachment_telemetry(stage, status, created_at DESC);

ALTER TABLE public.whatsapp_attachment_telemetry ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar a telemetria; inserts via service_role (edge function)
CREATE POLICY "Admins can view attachment telemetry"
  ON public.whatsapp_attachment_telemetry
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
