import { Link } from "react-router-dom";
import { productImageClass } from "@/lib/productImage";
import { products } from "@/data/products";
import { formatBRL } from "@/lib/pricing";

export function FeaturedProducts() {
  const featured = products.filter((p) => p.featured && !p.quoteOnly).slice(0, 4);

  return (
    <section className="container-custom mt-4" aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="sr-only">Produtos em destaque</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {featured.map((p, i) => (
          <Link
            key={p.id}
            to={`/produtos?q=${encodeURIComponent(p.name)}`}
            className="tile p-4 flex flex-col hover:shadow-hover transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="rounded-2xl bg-card ring-1 ring-black/5 aspect-[4/3] grid place-items-center relative overflow-hidden">
              <img src={p.image} alt="" loading="lazy" width={300} height={225} className={productImageClass(p)} />
              {i === 0 && (
                <span className="absolute top-2 left-2 text-[11px] font-extrabold bg-primary text-primary-foreground px-2 py-1 rounded-lg">
                  Mais vendido
                </span>
              )}
            </div>
            <h3 className="mt-3 font-extrabold text-base">{p.name}</h3>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 mt-1">
              <span className="font-extrabold text-lg whitespace-nowrap">
                {p.sizePricing ? <span className="text-xs font-semibold text-muted-foreground">a partir de </span> : null}
                {formatBRL(p.sizePricing ? Math.min(...p.sizePricing.flatMap((sp) => sp.tiers.map((t) => t.price))) : p.price)}
                <span className="text-xs text-muted-foreground font-semibold">/{p.unit === "kg" ? "kg" : "un."}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                mín. {p.minOrder.toLocaleString("pt-BR")} {p.unit === "kg" ? "kg" : "un."}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
