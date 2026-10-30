import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { productImageClass } from "@/lib/productImage";
import { products } from "@/data/products";
import { formatBRL, fromPrice } from "@/lib/pricing";
import { whatsappWith } from "@/lib/company";

// Short traits taken from each product's own description in the catalog.
const TRAITS: Record<string, string[]> = {
  envelope: ["Cores preto ou branco", "Para e-commerce e logística"],
  "envelope-coex": ["Branco por fora, cinza por dentro", "Resistente e impermeável"],
  "envelope-cinza": ["Privacidade no envio", "Resistente e impermeável"],
  "envelope-personalizado": ["Com a sua logomarca", "Produção em 30 dias"],
};

const QUOTE_URL = whatsappWith("Olá! Gostaria de um orçamento de envelope personalizado com a minha logomarca.");

// Side-by-side materials: the whole online catalog, so no product is repeated to fill space.
export function FeaturedProducts() {
  const featured = products.filter((p) => p.featured && !p.adminOnly);

  return (
    <section className="container-custom mt-12" aria-labelledby="featured-heading">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <div>
          <h2 id="featured-heading" className="text-2xl md:text-3xl font-extrabold">Escolha o material</h2>
          <p className="text-muted-foreground mt-1">Envelopes de segurança para cada tipo de envio.</p>
        </div>
        <Link to="/produtos" className="text-sm font-bold text-navy-light flex items-center gap-1 hover:text-foreground">
          Ver catálogo completo <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featured.map((p, i) => {
          const sizes = p.sizePricing?.map((sp) => sp.size) ?? p.sizes ?? [];
          const unit = p.unit === "kg" ? "kg" : "un.";
          return (
            <li
              key={p.id}
              className="tile p-4 flex flex-col hover:shadow-hover transition-shadow animate-enter"
              style={{ "--enter-delay": `${i * 40}ms` } as CSSProperties}
            >
              <div className="rounded-2xl bg-card ring-1 ring-black/5 aspect-[16/9] sm:aspect-[4/3] relative overflow-hidden">
                <img src={p.image} alt={p.name} loading="lazy" width={400} height={300} className={productImageClass(p)} />
                {p.quoteOnly && (
                  <span className="absolute top-2 left-2 text-[11px] font-extrabold bg-beige text-navy px-2 py-1 rounded-lg">Sob orçamento</span>
                )}
              </div>
              <h3 className="mt-4 font-extrabold text-lg">{p.name}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {(TRAITS[p.id] ?? []).map((trait) => (
                  <li key={trait} className="flex items-start gap-1.5">
                    <Check className="w-4 h-4 mt-0.5 text-success shrink-0" aria-hidden="true" /> {trait}
                  </li>
                ))}
              </ul>
              {sizes.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {sizes.length} tamanhos: {sizes.slice(0, 4).join(" · ")}
                  {sizes.length > 4 ? " …" : ""}
                </p>
              )}
              <div className="mt-auto pt-4 flex items-end justify-between gap-2">
                {p.quoteOnly ? (
                  <span className="text-sm text-muted-foreground">mín. {p.minOrder.toLocaleString("pt-BR")} {unit}</span>
                ) : (
                  <>
                    <span className="font-extrabold text-lg whitespace-nowrap">
                      {p.sizePricing && <span className="block text-xs font-semibold text-muted-foreground">a partir de</span>}
                      {formatBRL(fromPrice(p))}
                      <span className="text-xs text-muted-foreground font-semibold">/{unit}</span>
                    </span>
                    <span className="text-xs text-muted-foreground pb-1">mín. {p.minOrder.toLocaleString("pt-BR")} {unit}</span>
                  </>
                )}
              </div>
              {p.quoteOnly ? (
                <a
                  href={QUOTE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex justify-center items-center gap-2 h-11 rounded-xl bg-beige text-navy font-bold hover:bg-beige-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" /> Pedir orçamento
                </a>
              ) : (
                <Link
                  to={`/produtos?q=${encodeURIComponent(p.name)}`}
                  className="mt-3 inline-flex justify-center items-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-navy-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Ver tamanhos e preços <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
