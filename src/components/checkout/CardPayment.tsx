import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFunctionErrorMessage } from "@/lib/functionErrors";

// Card form from AbacatePay (abacatepay.js): the number and CVV live in their iframe and
// we only get a one-time token, which pay-abacate-card charges for the order total.
export const ABACATEPAY_PUBLIC_KEY = import.meta.env.VITE_ABACATEPAY_PUBLIC_KEY as string | undefined;
const SCRIPT_URL = "https://abacatepay.com/abacatepay.js";

interface AbacateCheckout {
  mount: (target: HTMLElement) => Promise<void>;
  tokenize: (customer: CardCustomer) => Promise<{ token: string }>;
  destroy: () => void;
}

declare global {
  interface Window {
    AbacatePay?: {
      create: (options: {
        publicKey: string;
        amount: number;
        icons?: boolean;
        onCardChange?: (state: { canTokenize: boolean }) => void;
      }) => AbacateCheckout;
    };
  }
}

export interface CardCustomer {
  name: string;
  email: string;
  taxId: string;
  cellphone: string;
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.AbacatePay) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Não foi possível carregar o formulário de cartão."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface CardPaymentProps {
  orderId: string;
  totalCents: number;
  customer: CardCustomer;
  formattedTotal: string;
  onPaid: () => void;
}

export const CardPayment = ({ orderId, totalCents, customer, formattedTotal, onPaid }: CardPaymentProps) => {
  const container = useRef<HTMLDivElement>(null);
  const checkout = useRef<AbacateCheckout | null>(null);
  const [ready, setReady] = useState(false);
  const [canPay, setCanPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript();
        if (cancelled || !container.current || !window.AbacatePay || !ABACATEPAY_PUBLIC_KEY) return;
        checkout.current = window.AbacatePay.create({
          publicKey: ABACATEPAY_PUBLIC_KEY,
          amount: totalCents,
          icons: true,
          onCardChange: ({ canTokenize }) => setCanPay(canTokenize),
        });
        await checkout.current.mount(container.current);
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar o formulário de cartão.");
      }
    })();
    return () => {
      cancelled = true;
      checkout.current?.destroy();
      checkout.current = null;
    };
  }, [totalCents]);

  const pay = async () => {
    if (!checkout.current) return;
    setPaying(true);
    setError(null);
    try {
      const { token } = await checkout.current.tokenize(customer);
      const { data, error: fnError } = await supabase.functions.invoke("pay-abacate-card", {
        body: { orderId, token },
      });
      if (fnError) throw new Error(await getFunctionErrorMessage(fnError, "Não foi possível processar o cartão."));
      if (data?.status === "PAID") onPaid();
      else setPending(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível processar o cartão.");
    } finally {
      setPaying(false);
    }
  };

  if (pending) {
    return (
      <p className="text-sm text-muted-foreground animate-pulse">
        Pagamento em análise pelo banco. Avisaremos por e-mail assim que for aprovado.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div ref={container} className="min-h-[180px]" />
      {!ready && !error && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando formulário seguro…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" className="w-full gap-2" disabled={!ready || !canPay || paying} onClick={pay}>
        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {paying ? "Processando..." : `Pagar ${formattedTotal}`}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Os dados do cartão vão direto para o AbacatePay, com criptografia. Visa e Mastercard.
      </p>
    </div>
  );
};
