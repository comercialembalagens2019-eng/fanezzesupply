-- Indexes for the queries the app actually runs, and RLS policies that evaluate
-- auth.uid()/has_role() once per query instead of once per row.
-- Plan: docs/plans/2026-10-29-db-indexes.md

-- 1. Indexes -----------------------------------------------------------------

-- Checkout, Pedidos and the test order look up a user's companies, newest first.
-- Also covers the companies.user_id foreign key.
CREATE INDEX IF NOT EXISTS companies_user_id_updated_at_idx
  ON public.companies (user_id, updated_at DESC);

-- Pedidos lists a customer's orders newest first, and the orders RLS policy joins on
-- company_id. Also covers the orders.company_id foreign key.
CREATE INDEX IF NOT EXISTS orders_company_id_created_at_idx
  ON public.orders (company_id, created_at DESC);

-- Admin panel: all orders, newest first.
CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);

-- Password reset: codes for an e-mail, newest first (rate limit and validation).
CREATE INDEX IF NOT EXISTS password_reset_codes_email_created_at_idx
  ON public.password_reset_codes (email, created_at DESC);

-- Superseded by the index above (same leading column).
DROP INDEX IF EXISTS public.idx_password_reset_codes_email;
-- Never used: cleanup filters with "expires_at < now() OR used", which scans anyway.
DROP INDEX IF EXISTS public.idx_password_reset_codes_expires_at;

-- 2. RLS: same permissions, evaluated once per query -------------------------

-- carts: owner manages their cart; admins can read all.
DROP POLICY IF EXISTS "Users manage their own cart" ON public.carts;
DROP POLICY IF EXISTS "Admins can view all carts" ON public.carts;
CREATE POLICY "Owner or admin can view carts" ON public.carts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)));
CREATE POLICY "Owner can insert cart" ON public.carts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Owner can update cart" ON public.carts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Owner can delete cart" ON public.carts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- companies
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
CREATE POLICY "Owner or admin can view companies" ON public.companies FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- orders (read-only for clients; writes go through edge functions)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own company orders" ON public.orders;
CREATE POLICY "Owner or admin can view orders" ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = orders.company_id AND c.user_id = (SELECT auth.uid())
    )
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role))
  );

-- user_roles: users read their own roles; only admins read all and write.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can write user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Owner or admin can view roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)));
CREATE POLICY "Only admins can write user_roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)));
CREATE POLICY "Only admins can update user_roles" ON public.user_roles FOR UPDATE TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)));
CREATE POLICY "Only admins can delete user_roles" ON public.user_roles FOR DELETE TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role)));
