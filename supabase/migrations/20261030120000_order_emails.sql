-- One row per customer e-mail sent for an order. The primary key makes each kind go out
-- once even when a webhook and the PIX status check confirm the same payment together.
CREATE TABLE IF NOT EXISTS public.order_emails (
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('paid', 'shipped', 'delivered')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, kind)
);

-- Only edge functions (service role) touch this table.
ALTER TABLE public.order_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_emails FROM anon, authenticated;
