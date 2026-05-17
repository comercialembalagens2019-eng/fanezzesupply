
-- 1. Lock down password_reset_codes: explicitly deny all access to anon/authenticated.
-- Service role bypasses RLS, so edge functions continue to work.
DROP POLICY IF EXISTS "Deny all access to password_reset_codes" ON public.password_reset_codes;
CREATE POLICY "Deny all access to password_reset_codes"
ON public.password_reset_codes
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2. Harden user_roles: prevent privilege escalation via self-insert/update/delete.
-- Recreate the admin ALL policy with WITH CHECK, and add a RESTRICTIVE policy that
-- blocks any non-admin write attempt, even if another permissive policy is added later.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can write user_roles" ON public.user_roles;
CREATE POLICY "Only admins can write user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can update user_roles" ON public.user_roles;
CREATE POLICY "Only admins can update user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Only admins can delete user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
