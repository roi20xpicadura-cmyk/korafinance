
-- ============================================================
-- 1. pluggy_webhooks: deny-all explícito (só service role escreve)
-- ============================================================
CREATE POLICY "Deny all client access to pluggy webhooks"
  ON public.pluggy_webhooks
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- 2. referrals: esconder referred_email do referrer
--    Estratégia: substituir policy ALL por policies separadas que
--    não exponham a coluna sensível diretamente. Como RLS é por
--    linha (não coluna), revogamos SELECT da coluna referred_email
--    para authenticated/anon. O referrer continua vendo status/reward.
-- ============================================================
DROP POLICY IF EXISTS "Users manage own referrals" ON public.referrals;

CREATE POLICY "Users view own referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users insert own referrals"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users update own referrals"
  ON public.referrals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users delete own referrals"
  ON public.referrals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Esconder a coluna referred_email do acesso direto via API
REVOKE SELECT (referred_email) ON public.referrals FROM authenticated, anon;

-- ============================================================
-- 3. kora_actions: adicionar INSERT / UPDATE / DELETE para o dono
-- ============================================================
CREATE POLICY "Users insert own actions"
  ON public.kora_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own actions"
  ON public.kora_actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own actions"
  ON public.kora_actions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. kora_coaching_plans: adicionar INSERT e DELETE
-- ============================================================
CREATE POLICY "Users insert own plans"
  ON public.kora_coaching_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own plans"
  ON public.kora_coaching_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Revogar EXECUTE de funções SECURITY DEFINER que só backend usa
--    has_role NÃO é revogada porque é chamada por policies RLS
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.delete_user_kora_data(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.get_kora_context(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.get_monthly_balances(uuid) FROM authenticated, anon, public;
