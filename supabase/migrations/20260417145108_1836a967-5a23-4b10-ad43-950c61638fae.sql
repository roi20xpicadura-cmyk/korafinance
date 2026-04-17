
CREATE OR REPLACE FUNCTION public.touch_detected_subscriptions()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
