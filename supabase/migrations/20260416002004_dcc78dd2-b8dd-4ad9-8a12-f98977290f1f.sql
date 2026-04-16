
-- WhatsApp connections per user
CREATE TABLE public.whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  verified boolean DEFAULT false,
  verification_code text,
  verification_expires_at timestamptz,
  active boolean DEFAULT true,
  connected_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  total_messages integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp connections"
  ON public.whatsapp_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- WhatsApp message history
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  direction text NOT NULL,
  message text NOT NULL,
  intent text,
  action_taken text,
  transaction_created_id uuid,
  processed boolean DEFAULT false,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp messages"
  ON public.whatsapp_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Validation trigger for direction
CREATE OR REPLACE FUNCTION public.validate_whatsapp_message_direction()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.direction NOT IN ('inbound', 'outbound') THEN
    RAISE EXCEPTION 'Invalid direction: %', NEW.direction;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_whatsapp_msg_direction
  BEFORE INSERT OR UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_whatsapp_message_direction();

-- WhatsApp conversation context
CREATE TABLE public.whatsapp_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  messages jsonb DEFAULT '[]'::jsonb,
  last_intent text,
  pending_confirmation jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp context"
  ON public.whatsapp_context FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
