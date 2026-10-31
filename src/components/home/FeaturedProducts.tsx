import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { products } from "@/data/products";
import { formatBRL, fromPrice } from "@/lib/pricing";

const traits: Record<string, string> = {
  envelope: "Preto ou branco",
  "envelope-coex": "Branco por fora, cinza por dentro",
  "envelope-cinza": "Privacidade no envio",
};

export function FeaturedProducts() {
  const materials = products.filter((p) => p.featured && !p.adminOnly && !p.quoteOnly);
  return (
    <section id="materiais" className="scroll-mt-32 sm:scroll-mt-24" aria-labelledby="featured-heading">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
        <div>
          <h2 id="featured-heading" className="text-2xl md:text-3xl font-extrabold">Escolha o material</h2>
          <p className="text-muted-foreground mt-2">Compare os envelopes e encontre o seu tamanho.</p>
        </div>
        <Link to="/produtos" className="min-h-11 text-sm font-bold text-navy-light inline-flex items-center gap-1 rounded focus-visible:ring-2 focus-visible:ring-ring">
          Ver catálogo completo <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {materials.map((p) => {
          const bestTier = p.sizePricing ? Math.max(...p.sizePricing.flatMap((s) => s.tiers.map((t) => t.minQty))) : null;
          return (
            <li key={p.id} className="min-w-0 flex flex-col bg-card rounded-2xl overflow-hidden ring-1 ring-black/5">
              <img src={p.image} alt={p.name} loading="lazy" width={1200} height={900} className="w-full aspect-[3/2] object-cover bg-muted" />
              <div className="p-5 md:p-6 flex flex-col flex-1">
                <h3 className="font-extrabold text-xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{traits[p.id]}. Mínimo de {p.minOrder.toLocaleString("pt-BR")} unidades.</p>
                <div className="mt-5">
                  <p className="text-xs text-muted-foreground">{bestTier ? "A partir de" : "Preço por unidade"}</p>
                  <p className="font-extrabold text-2xl mt-1">{formatBRL(fromPrice(p))}<span className="text-sm font-medium text-muted-foreground"> / un.</span></p>
                  <p className="text-xs text-muted-foreground mt-1 min-h-8">{bestTier ? `Na faixa de ${bestTier.toLocaleString("pt-BR")}+ unidades; varia com o tamanho.` : "Mesmo preço nos tamanhos disponíveis."}</p>
                </div>
                <Link to={`/produtos?produto=${encodeURIComponent(p.id)}`} className="mt-5 min-h-11 px-4 py-3 inline-flex justify-center items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-navy-light focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Ver tamanhos e preços <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
