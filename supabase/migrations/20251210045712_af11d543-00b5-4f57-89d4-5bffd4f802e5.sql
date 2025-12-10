-- Fix orders table RLS policies
-- Remove the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can view orders by company" ON public.orders;

-- Remove the insecure public INSERT policy  
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

-- Create secure SELECT policy: Users can only view orders for companies they own
CREATE POLICY "Users can view their own company orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = orders.company_id 
    AND companies.user_id = auth.uid()
  )
);

-- Create secure INSERT policy: Users can only create orders for their own companies
CREATE POLICY "Users can insert orders for their companies" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_id 
    AND companies.user_id = auth.uid()
  )
);

-- Add UPDATE policy for orders (needed for payment webhook)
CREATE POLICY "Service role can update orders" 
ON public.orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Fix companies table RLS policy for NULL user_id exposure
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;

-- Users can only view companies they own (remove NULL user_id access)
CREATE POLICY "Users can view their own companies" 
ON public.companies 
FOR SELECT 
USING (auth.uid() = user_id);