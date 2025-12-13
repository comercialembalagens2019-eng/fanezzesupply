-- Create a secure function for updating order status
-- This restricts what values can be set and only allows status updates
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the new status is in the allowed list
  IF p_new_status NOT IN ('pending', 'processing', 'paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Allowed values: pending, processing, paid, failed, cancelled', p_new_status;
  END IF;
  
  -- Update only the status and updated_at fields
  UPDATE public.orders 
  SET 
    status = p_new_status,
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Check if the order was found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (for RPC calls from edge functions)
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO service_role;

-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;