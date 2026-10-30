import { FileText, MessageCircle, Package, Truck } from "lucide-react";
import { formatBRL, SHIPPING_FEE } from "@/lib/pricing";
import { COMPANY, WHATSAPP_URL } from "@/lib/company";

// Facts the business already guarantees elsewhere on the site (pricing, checkout, footer).
const items = [
  { icon: Package, title: "Compra em atacado", text: "Preço por unidade cai conforme a quantidade." },
  { icon: FileText, title: "Nota fiscal", text: "NF-e em todo pedido, emitida para o seu CNPJ." },
  { icon: Truck, title: "Entrega", text: `Frete grátis em Joinville. Demais localidades: ${formatBRL(SHIPPING_FEE)}.` },
  { icon: MessageCircle, title: "Atendimento comercial", text: `${COMPANY.hours} pelo WhatsApp.`, href: WHATSAPP_URL },
];

export function Differentials() {
  return (
    <section className="container-custom mt-4" aria-label="Diferenciais da FNZ Supply">
      <ul className="tile grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-border">
        {items.map((item) => {
          const content = (
            <>
              <span className="w-11 h-11 rounded-xl bg-muted text-foreground grid place-items-center shrink-0">
                <item.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>
                <b className="block font-extrabold text-foreground">{item.title}</b>
                <span className="block text-sm text-muted-foreground leading-snug mt-0.5">{item.text}</span>
              </span>
            </>
          );
          return (
            <li key={item.title}>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 p-5 h-full hover:bg-muted/40 transition-colors rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {content}
                </a>
              ) : (
                <div className="flex items-start gap-3.5 p-5 h-full">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
