import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "@/data/products";
import { formatBRL, getUnitPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface SizeEntry {
  key: string;
  productId: string;
  material: string;
  image: string;
  size: string;
  /** Price at the minimum order and, when cheaper, at the best quantity tier. */
  price: number;
  bestPrice: number | null;
  bestFrom: number | null;
  minOrder: number;
}

// Every size sold online, straight from the catalog (no invented sizes).
const entries: SizeEntry[] = products
  .filter((p) => !p.quoteOnly && !p.adminOnly)
  .flatMap((p) => {
    const sizes = p.sizePricing?.map((sp) => sp.size) ?? p.sizes ?? [];
    return sizes.map((size) => {
      const tiers = p.sizePricing?.find((sp) => sp.size === size)?.tiers ?? [];
      const best = tiers.length > 1 ? tiers.reduce((a, b) => (b.minQty > a.minQty ? b : a)) : null;
      return {
        key: `${p.id}-${size}`,
        productId: p.id,
        material: p.name,
        image: p.image,
        size,
        price: getUnitPrice(`${p.id}-${size}`, p.minOrder, p.price),
        bestPrice: best ? best.price : null,
        bestFrom: best ? best.minQty : null,
        minOrder: p.minOrder,
      };
    });
  });

const materials = [...new Set(entries.map((e) => e.material))];
const MOBILE_LIMIT = 6;

export function SizeGuide() {
  const [material, setMaterial] = useState<string>("Todos");
  // Phones show the first sizes and expand on request; wider screens show all of them.
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(() => (material === "Todos" ? entries : entries.filter((e) => e.material === material)), [material]);

  return (
    <section className="container-custom mt-12" aria-labelledby="size-guide-heading">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div>
          <h2 id="size-guide-heading" className="text-2xl md:text-3xl font-extrabold">Encontre o tamanho ideal para sua operação</h2>
          <p className="text-muted-foreground mt-1">Todos os tamanhos disponíveis, com preço por unidade e pedido mínimo.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0" role="tablist" aria-label="Filtrar por material">
          {["Todos", ...materials].map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={material === m}
              onClick={() => setMaterial(m)}
              className={cn(
                "shrink-0 h-10 px-4 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                material === m ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-black/5 text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {visible.map((e, i) => (
          <li key={e.key} className={cn(!showAll && i >= MOBILE_LIMIT && "hidden sm:block")}>
            <Link
              to={`/produtos?q=${encodeURIComponent(`${e.material} ${e.size}`)}`}
              className="group tile p-3 h-full flex flex-col hover:shadow-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-2.5">
                <img src={e.image} alt="" loading="lazy" width={48} height={36} className="w-12 h-9 rounded-lg object-cover bg-muted shrink-0" />
                <span className="min-w-0">
                  <b className="block text-lg font-extrabold leading-none tabular-nums">{e.size}</b>
                  <span className="block text-xs text-muted-foreground truncate mt-1">{e.material}</span>
                </span>
              </span>
              <span className="mt-3 text-sm">
                <b className="tabular-nums">{formatBRL(e.price)}</b>
                <span className="text-muted-foreground">/un.</span>
              </span>
              {e.bestPrice !== null && e.bestFrom !== null && (
                <span className="text-xs text-success font-semibold tabular-nums">
                  {formatBRL(e.bestPrice)} a partir de {e.bestFrom.toLocaleString("pt-BR")}
                </span>
              )}
              <span className="mt-auto pt-2 text-xs text-muted-foreground">mín. {e.minOrder.toLocaleString("pt-BR")} un.</span>
            </Link>
          </li>
        ))}
      </ul>
      {!showAll && visible.length > MOBILE_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="sm:hidden mt-3 w-full h-11 rounded-xl bg-card ring-1 ring-black/5 text-sm font-semibold text-foreground"
        >
          Ver todos os {visible.length} tamanhos
        </button>
      )}
    </section>
  );
}
