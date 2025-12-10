-- 1. Fix companies INSERT policy - require authentication
DROP POLICY IF EXISTS "Anyone can insert companies" ON public.companies;

CREATE POLICY "Authenticated users can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Convert RESTRICTIVE SELECT policies to PERMISSIVE on companies
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;

CREATE POLICY "Users can view their own companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Convert RESTRICTIVE policies to PERMISSIVE on orders
DROP POLICY IF EXISTS "Users can view their own company orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders for their companies" ON public.orders;

CREATE POLICY "Users can view their own company orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = orders.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert orders for their companies" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_id 
    AND companies.user_id = auth.uid()
  )
);

-- 4. Convert RESTRICTIVE policies to PERMISSIVE on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Make user_id NOT NULL on companies (update existing NULL values first)
UPDATE public.companies SET user_id = gen_random_uuid() WHERE user_id IS NULL;

ALTER TABLE public.companies ALTER COLUMN user_id SET NOT NULL;

-- 6. Fix UPDATE policy on companies to be PERMISSIVE
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;

CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);