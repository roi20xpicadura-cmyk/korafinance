-- 1) Substituir o trigger pra permitir alterações via service role / postgres role
CREATE OR REPLACE FUNCTION public.prevent_plan_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_role_name text := current_setting('role', true);
  jwt_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  -- Permitir alterações vindas de service_role, postgres ou supabase_admin
  -- (webhooks, edge functions com service key, migrations administrativas)
  IF jwt_role = 'service_role'
     OR current_role_name IN ('service_role', 'postgres', 'supabase_admin')
     OR session_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Para usuários autenticados normais: impedir auto-promoção
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
$function$;

-- 2) Agora consegue atualizar o plano do usuário
UPDATE public.profiles
SET plan = 'pro',
    plan_expires_at = (now() + interval '1 month')
WHERE id = '2295121b-e489-46da-9b4e-2868dab18a9d';