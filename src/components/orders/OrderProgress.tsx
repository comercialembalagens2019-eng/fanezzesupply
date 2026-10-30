import { Check, ClipboardCheck, PackageCheck, PackageOpen, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

// Fulfillment only starts once the payment is confirmed ("paid").
const STEPS = [
  { key: "received", label: "Pedido recebido", icon: ClipboardCheck },
  { key: "paid", label: "Em preparação", icon: PackageOpen },
  { key: "shipped", label: "Enviado", icon: Truck },
  { key: "delivered", label: "Entregue", icon: PackageCheck },
];

interface OrderProgressProps {
  status: string;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

const shortDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null;

// Only dates the system really records are shown; the "in preparation" step has none.
export function OrderProgress({ status, createdAt, shippedAt, deliveredAt }: OrderProgressProps) {
  const current = STEPS.findIndex((s) => s.key === status);
  if (current === -1) return null;
  const dates = [shortDate(createdAt), null, shortDate(shippedAt), shortDate(deliveredAt)];

  return (
    <ol className="flex flex-col sm:flex-row gap-0 sm:gap-2" aria-label="Andamento do pedido">
      {STEPS.map((step, i) => {
        const done = i < current || (i === current && status === "delivered");
        const isCurrent = i === current && status !== "delivered";
        const Icon = step.icon;
        const last = i === STEPS.length - 1;
        return (
          <li
            key={step.key}
            className="relative flex sm:flex-1 sm:flex-col items-start sm:items-center gap-3 sm:gap-2 pb-4 sm:pb-0 last:pb-0 sm:text-center"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connector to the next step: vertical on phones, horizontal from sm up */}
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[17px] top-9 bottom-0 w-0.5 sm:left-[calc(50%+22px)] sm:right-[calc(-50%+22px)] sm:top-[17px] sm:bottom-auto sm:w-auto sm:h-0.5",
                  i < current ? "bg-success" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "relative w-9 h-9 rounded-full grid place-items-center shrink-0 transition-colors",
                done && "bg-success text-white",
                isCurrent && "bg-navy text-white ring-4 ring-navy/10 dark:bg-primary dark:text-primary-foreground",
                !done && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> : <Icon className="w-4 h-4" aria-hidden="true" />}
            </span>
            <span className="pt-1.5 sm:pt-0 leading-tight">
              <span className={cn("block text-sm font-semibold", done || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
                {done && <span className="sr-only"> (concluído)</span>}
              </span>
              {dates[i] && <span className="block text-xs text-muted-foreground mt-0.5">{dates[i]}</span>}
              {isCurrent && !dates[i] && <span className="block text-xs text-muted-foreground mt-0.5">Etapa atual</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
