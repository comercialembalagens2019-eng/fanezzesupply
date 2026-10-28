-- 1. Shipping charged per order (R$ 19,90 outside Joinville/SC), included in total_amount.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_amount numeric(10, 2) NOT NULL DEFAULT 0;

-- 2. Fulfillment timestamps for the "enviado" / "entregue" steps.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 3. Payment status updates (webhooks) must never move an order that is already
--    paid, shipped or delivered backwards; only cancellation is allowed.
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

  IF v_current IN ('paid', 'shipped', 'delivered') AND p_new_status <> 'cancelled' THEN
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

-- 4. Admin-only fulfillment step: paid -> shipped -> delivered (and back one step to
--    undo a misclick). Orders that were never paid cannot be shipped.
CREATE OR REPLACE FUNCTION public.admin_set_fulfillment_status(p_order_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('paid', 'shipped', 'delivered') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT status INTO v_current FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current NOT IN ('paid', 'shipped', 'delivered') THEN
    RAISE EXCEPTION 'Only paid orders can be shipped or delivered';
  END IF;

  UPDATE public.orders
  SET status = p_status,
      shipped_at = CASE
        WHEN p_status = 'paid' THEN NULL
        WHEN p_status IN ('shipped', 'delivered') THEN COALESCE(shipped_at, now())
      END,
      delivered_at = CASE WHEN p_status = 'delivered' THEN COALESCE(delivered_at, now()) END,
      updated_at = now()
  WHERE id = p_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_fulfillment_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_fulfillment_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_fulfillment_status(uuid, text) TO authenticated;