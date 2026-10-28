import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { status: "paid", label: "Pago", icon: CheckCircle2 },
  { status: "shipped", label: "Enviado", icon: Truck },
  { status: "delivered", label: "Entregue", icon: PackageCheck },
];

interface OrderProgressProps {
  status: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

const shortDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null;

// Fulfillment tracker shown once an order is paid.
export function OrderProgress({ status, shippedAt, deliveredAt }: OrderProgressProps) {
  const current = STEPS.findIndex((s) => s.status === status);
  if (current === -1) return null;
  const dates = [null, shortDate(shippedAt), shortDate(deliveredAt)];

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Andamento do pedido">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const Icon = step.icon;
        return (
          <li key={step.status} className="flex flex-col items-center text-center gap-1" aria-current={i === current ? "step" : undefined}>
            <div className="flex items-center w-full">
              <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "w-9 h-9 rounded-full grid place-items-center shrink-0",
                  done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "opacity-0" : i < current ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-xs font-bold", done ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
            {dates[i] && <span className="text-[11px] text-muted-foreground">{dates[i]}</span>}
          </li>
        );
      })}
    </ol>
  );
}
