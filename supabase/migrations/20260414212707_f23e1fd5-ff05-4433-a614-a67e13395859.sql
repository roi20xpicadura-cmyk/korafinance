-- 1. FIX CRITICAL: pluggy_webhooks - remove public SELECT, only service role should read
DROP POLICY IF EXISTS "Service role can read webhooks" ON public.pluggy_webhooks;

-- 2. FIX CRITICAL: waitlist - restrict SELECT to not expose emails publicly
DROP POLICY IF EXISTS "Anyone can count waitlist" ON public.waitlist;

-- 3. FIX CRITICAL: subscriptions - users should only SELECT, not INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. FIX CRITICAL: profiles - protect plan escalation with trigger
CREATE OR REPLACE FUNCTION public.prevent_plan_escalation()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan := OLD.plan;
  END IF;
  IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
    NEW.plan_expires_at := OLD.plan_expires_at;
  END IF;
  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    NEW.stripe_customer_id := OLD.stripe_customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_plan_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_plan_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_escalation();

-- 5. FIX WARNING: achievements - restrict to SELECT + INSERT only
DROP POLICY IF EXISTS "Users manage own achievements" ON public.achievements;
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements"
  ON public.achievements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. FIX WARNING: user_config - protect gamification columns
CREATE OR REPLACE FUNCTION public.protect_gamification_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.financial_score IS DISTINCT FROM OLD.financial_score THEN
    NEW.financial_score := OLD.financial_score;
  END IF;
  IF NEW.xp_points IS DISTINCT FROM OLD.xp_points THEN
    NEW.xp_points := OLD.xp_points;
  END IF;
  IF NEW.level IS DISTINCT FROM OLD.level THEN
    NEW.level := OLD.level;
  END IF;
  IF NEW.streak_days IS DISTINCT FROM OLD.streak_days THEN
    NEW.streak_days := OLD.streak_days;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_gamification ON public.user_config;
CREATE TRIGGER trg_protect_gamification
  BEFORE UPDATE ON public.user_config
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_gamification_fields();

-- 7. FIX WARNING: pluggy_webhooks INSERT - restrict to anon role
DROP POLICY IF EXISTS "Anyone can insert webhooks" ON public.pluggy_webhooks;
CREATE POLICY "Anon can insert webhooks"
  ON public.pluggy_webhooks FOR INSERT TO anon
  WITH CHECK (true);