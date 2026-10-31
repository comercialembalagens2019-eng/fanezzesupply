import { FileText, Package, Truck } from "lucide-react";
import { formatBRL, SHIPPING_FEE } from "@/lib/pricing";

const items = [
  { icon: Package, title: "Preço por quantidade", text: "Faixas para comprar em atacado." },
  { icon: FileText, title: "Nota fiscal", text: "NF-e para o seu CNPJ." },
  { icon: Truck, title: "Entrega", text: `Grátis em Joinville/SC. Demais cidades: ${formatBRL(SHIPPING_FEE)}.` },
];

export function Differentials() {
  return (
    <section aria-label="Diferenciais da FNZ Supply">
      <ul className="grid gap-5 sm:grid-cols-3 py-2">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3 min-w-0">
            <item.icon className="w-5 h-5 mt-0.5 shrink-0 text-navy-light" aria-hidden="true" />
            <span>
              <b className="block text-sm font-extrabold">{item.title}</b>
              <span className="block text-xs leading-relaxed text-muted-foreground mt-1">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
