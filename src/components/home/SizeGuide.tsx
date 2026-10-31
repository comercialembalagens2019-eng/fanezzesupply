import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { products } from "@/data/products";
import { formatBRL, getUnitPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface SizeEntry {
  key: string;
  productId: string;
  material: string;
  size: string;
  /** Width and height in cm, read from the size label ("20x30"). */
  w: number;
  h: number;
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
      const [w, h] = size.split("x").map(Number);
      return {
        key: `${p.id}-${size}`,
        productId: p.id,
        material: p.name,
        size,
        w,
        h,
        price: getUnitPrice(`${p.id}-${size}`, p.minOrder, p.price),
        bestPrice: best ? best.price : null,
        bestFrom: best ? best.minQty : null,
        minOrder: p.minOrder,
      };
    });
  });

const materials = [...new Set(entries.map((e) => e.material))];
const MOBILE_LIMIT = 6;
// All tiles share one scale, so a bigger envelope is drawn bigger.
const TILE_PX = 104 / Math.max(...entries.map((e) => Math.max(e.w, e.h)));
const A4 = { w: 21, h: 29.7 };

const isGray = (e: SizeEntry) => e.productId === "envelope-cinza";

function EnvelopeShape({ e, scale, className }: { e: SizeEntry; scale: number; className?: string }) {
  return (
    <span
      className={cn(
        "relative block rounded-[3px] outline outline-[1.5px] transition-[width,height] duration-300 ease-out motion-reduce:transition-none",
        isGray(e) ? "bg-[#7b7e83] outline-[#666]" : "bg-white outline-[#c9ced8]",
        className,
      )}
      style={{ width: e.w * scale, height: e.h * scale }}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[10%] rounded-t-[3px]", isGray(e) ? "bg-[#55585c]" : "bg-[#2b2b2b]")} />
    </span>
  );
}

export function SizeGuide() {
  const [material, setMaterial] = useState<string>("Todos");
  const [selectedKey, setSelectedKey] = useState(entries[0].key);
  // Phones show the first sizes and expand on request; wider screens show all of them.
  const [showAll, setShowAll] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const visible = useMemo(() => (material === "Todos" ? entries : entries.filter((e) => e.material === material)), [material]);
  const selected = entries.find((e) => e.key === selectedKey) ?? entries[0];
  // Envelope and A4 sheet side by side, at the largest scale that fits the panel.
  const cmp = Math.min(200 / Math.max(A4.h, selected.h), 180 / (A4.w + selected.w));

  const choose = (e: SizeEntry) => {
    setSelectedKey(e.key);
    // Below lg the panel sits above the grid, so bring it back into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panelRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
    }
  };

  return (
    <section id="guia-de-tamanhos" className="mt-10 md:mt-16 scroll-mt-32 sm:scroll-mt-24" aria-labelledby="size-guide-heading">
      <div className="flex flex-col 2xl:flex-row 2xl:items-end 2xl:justify-between gap-4 mb-6">
        <div>
          <h2 id="size-guide-heading" className="text-2xl md:text-3xl font-extrabold">Veja o tamanho antes de comprar</h2>
          <p className="text-muted-foreground mt-1">Cada envelope desenhado na mesma escala. Toque em um para comparar com uma folha A4.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto p-1 -m-1" role="group" aria-label="Filtrar por material">
          {["Todos", ...materials].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={material === m}
              onClick={() => setMaterial(m)}
              className={cn(
                "shrink-0 h-11 px-4 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                material === m ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-black/5 text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 lg:gap-5 items-start">
        <div className="min-w-0">
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {visible.map((e, i) => (
              <li key={e.key} className={cn(!showAll && i >= MOBILE_LIMIT && "hidden sm:block")}>
                <button
                  type="button"
                  aria-pressed={selected.key === e.key}
                  aria-label={`${e.size} cm, ${e.material}, ${formatBRL(e.bestPrice ?? e.price)} por unidade`}
                  onClick={() => choose(e)}
                  className={cn(
                    "tile w-full h-full p-3.5 text-left grid gap-2 border-2 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected.key === e.key ? "border-primary" : "border-transparent"
                  )}
                >
                  <span className="h-[110px] flex items-end justify-center" aria-hidden="true">
                    <EnvelopeShape e={e} scale={TILE_PX} />
                  </span>
                  <span>
                    <b className="block text-lg font-extrabold leading-tight tabular-nums">{e.size}</b>
                    <span className="block text-xs text-muted-foreground truncate">{e.material}</span>
                  </span>
                  <span className="text-sm">
                    <b className="tabular-nums">{formatBRL(e.bestPrice ?? e.price)}</b>
                    <span className="text-muted-foreground"> /un.</span>
                  </span>
                </button>
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
          <p className="mt-4 text-sm text-muted-foreground">Medidas em centímetros (largura x altura). Preços por unidade.</p>
        </div>

        <aside
          ref={panelRef}
          aria-live="polite"
          aria-label="Tamanho escolhido"
          className="min-w-0 order-first lg:order-none scroll-mt-32 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] rounded-3xl bg-primary text-primary-foreground p-6 grid gap-4"
        >
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">{selected.size} cm</h3>
            <p className="text-sm text-white/75">{selected.material}</p>
          </div>
          <div className="bg-white rounded-2xl h-[232px] flex items-end justify-center gap-3 p-3 overflow-hidden" aria-hidden="true">
            <span
              className="grid place-items-center bg-[#e9ebef] text-xs font-bold text-muted-foreground transition-[width,height] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: A4.w * cmp, height: A4.h * cmp }}
            >
              A4
            </span>
            <EnvelopeShape e={selected} scale={cmp} />
          </div>
          <dl className="grid gap-1.5 text-[15px]">
            {selected.bestPrice !== null && selected.bestFrom !== null ? (
              <>
                <div className="flex justify-between gap-3"><dt>Até {(selected.bestFrom - 1).toLocaleString("pt-BR")} un.</dt><dd className="font-bold tabular-nums">{formatBRL(selected.price)}/un.</dd></div>
                <div className="flex justify-between gap-3"><dt>{selected.bestFrom.toLocaleString("pt-BR")} ou mais</dt><dd className="font-bold tabular-nums text-green-300">{formatBRL(selected.bestPrice)}/un.</dd></div>
              </>
            ) : (
              <div className="flex justify-between gap-3"><dt>Preço por unidade</dt><dd className="font-bold tabular-nums">{formatBRL(selected.price)}/un.</dd></div>
            )}
            <div className="flex justify-between gap-3"><dt>Mínimo</dt><dd className="font-bold tabular-nums">{selected.minOrder.toLocaleString("pt-BR")} un.</dd></div>
          </dl>
          <Link
            to={`/produtos?produto=${encodeURIComponent(selected.productId)}&q=${encodeURIComponent(selected.size)}`}
            className="inline-flex items-center justify-center gap-2 min-h-12 rounded-xl bg-beige text-navy font-bold hover:bg-beige-light transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Comprar este tamanho <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
