
CREATE TABLE public.detected_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  estimated_amount NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  last_charge_date DATE,
  next_expected_date DATE,
  occurrences INTEGER NOT NULL DEFAULT 1,
  match_pattern TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  user_acknowledged BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_pattern)
);

ALTER TABLE public.detected_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.detected_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_detected_subs_user ON public.detected_subscriptions(user_id, status);

CREATE OR REPLACE FUNCTION public.touch_detected_subscriptions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_touch_detected_subs
  BEFORE UPDATE ON public.detected_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_detected_subscriptions();
