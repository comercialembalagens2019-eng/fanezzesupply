-- Drop the old password_reset_attempts table and create a new one for 6-digit codes
DROP TABLE IF EXISTS public.password_reset_attempts;

-- Create table for 6-digit verification codes
CREATE TABLE public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for email lookup
CREATE INDEX idx_password_reset_codes_email ON public.password_reset_codes(email);

-- Create index for cleanup of expired codes
CREATE INDEX idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No direct access from client - only edge functions with service role
-- This keeps the codes secure

-- Function to cleanup expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_codes
  WHERE expires_at < now() OR used = true;
END;
$$;