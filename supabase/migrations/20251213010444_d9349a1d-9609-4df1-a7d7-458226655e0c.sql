-- Create table to track password reset attempts for rate limiting
CREATE TABLE public.password_reset_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_email_created ON public.password_reset_attempts (email, created_at);

-- Enable RLS
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON public.password_reset_attempts
  FOR ALL USING (false);

-- Auto-delete old records (older than 24 hours) via function
CREATE OR REPLACE FUNCTION public.cleanup_old_reset_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE created_at < now() - interval '24 hours';
END;
$$;