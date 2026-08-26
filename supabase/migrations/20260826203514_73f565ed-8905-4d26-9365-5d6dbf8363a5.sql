CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
BEGIN
  IF p_new_status NOT IN ('pending', 'processing', 'paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT c.user_id INTO v_owner
  FROM public.orders o
  LEFT JOIN public.companies c ON c.id = o.company_id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- When called with an end-user JWT, only the order owner or an admin may update.
  IF auth.uid() IS NOT NULL
     AND auth.uid() IS DISTINCT FROM v_owner
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
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