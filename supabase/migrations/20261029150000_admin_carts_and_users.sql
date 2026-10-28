-- 1. Server-side copy of each signed-in customer's cart, so admins can see what is
--    in carts (including abandoned ones). Customers only read/write their own row.
CREATE TABLE IF NOT EXISTS public.carts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carts_items_is_array CHECK (jsonb_typeof(items) = 'array'),
  CONSTRAINT carts_items_size CHECK (pg_column_size(items) < 65536)
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own cart" ON public.carts;
CREATE POLICY "Users manage their own cart"
ON public.carts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all carts" ON public.carts;
CREATE POLICY "Admins can view all carts"
ON public.carts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_carts_updated_at ON public.carts;
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Admin-only list of registered accounts, including people who signed up but
--    never filled in company data (auth.users is not readable from the browser).
CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE (
   id uuid,
   email text,
   created_at timestamptz,
   last_sign_in_at timestamptz,
   email_confirmed_at timestamptz,
   is_admin boolean
 )
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at,
         public.has_role(u.id, 'admin'::public.app_role)
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
