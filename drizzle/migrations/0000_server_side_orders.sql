-- 1. Orders are created only by edge functions (service role), which price them from the
--    server-side catalog. Clients could previously insert orders with any total and status.
DROP POLICY IF EXISTS "Users can insert orders for their companies" ON public.orders;

-- 2. Provider charge id (AbacatePay PIX id, Stripe session or PaymentIntent id) bound to
--    the order, so a payment can only ever confirm the order it was created for.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_ref_key
  ON public.orders (payment_ref)
  WHERE payment_ref IS NOT NULL;

-- 3. A paid order can only move to cancelled; late or out-of-order webhook events
--    (e.g. payment_intent.processing after succeeded) must not downgrade it.
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_current text;
BEGIN
  IF p_new_status NOT IN ('pending', 'processing', 'paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT c.user_id, o.status INTO v_owner, v_current
  FROM public.orders o
  LEFT JOIN public.companies c ON c.id = o.company_id
  WHERE o.id = p_order_id
  FOR UPDATE OF o;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- When called with an end-user JWT, only the order owner or an admin may update.
  IF auth.uid() IS NOT NULL
     AND auth.uid() IS DISTINCT FROM v_owner
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_current = 'paid' AND p_new_status NOT IN ('paid', 'cancelled') THEN
    RETURN;
  END IF;

  UPDATE public.orders
  SET status = p_new_status, updated_at = now()
  WHERE id = p_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_order_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_order_status(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.update_order_status(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO service_role;

-- 4. Direct user lookup for password reset (auth.admin.listUsers only returns one page).
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

-- 5. Maintenance functions are SECURITY DEFINER and were callable by anyone via RPC.
REVOKE ALL ON FUNCTION public.cleanup_expired_reset_codes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_reset_codes() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_reset_codes() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reset_codes() TO service_role;

-- Its table was dropped in an earlier migration.
DROP FUNCTION IF EXISTS public.cleanup_old_reset_attempts();
