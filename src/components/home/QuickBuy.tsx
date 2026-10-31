import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { buildCartProduct, formatBRL, getUnitPrice } from "@/lib/pricing";

// Products sold online with sizes; prices come from the shared catalog.
const buyable = products.filter((p) => !p.quoteOnly && !p.adminOnly && (p.sizePricing?.length || p.sizes?.length));
const sizesOf = (p: (typeof buyable)[number]) => p.sizePricing?.map((sp) => sp.size) ?? p.sizes ?? [];
const quantitiesOf = (p: (typeof buyable)[number]) => [1, 2, 5, 10].map((k) => p.minOrder * k);
// COEX first, as in the approved layout.
const initial = buyable.find((p) => p.id === "envelope-coex") ?? buyable[0];

function Field({ label, id, value, onChange, children }: { label: string; id: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[13px] font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full h-12 rounded-md border-[1.5px] border-border bg-card pl-3.5 pr-10 text-[15px] font-semibold cursor-pointer hover:border-muted-foreground/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
}

export function QuickBuy() {
  const { addToCart } = useCart();
  const [productId, setProductId] = useState(initial.id);
  const product = buyable.find((p) => p.id === productId)!;
  const sizes = sizesOf(product);
  const [size, setSize] = useState(sizes[0]);
  const [color, setColor] = useState(product.colors?.[0] ?? "");
  const [quantity, setQuantity] = useState(quantitiesOf(product)[1]);

  const unitPrice = getUnitPrice(`${product.id}-${size}`, quantity, product.price);

  const changeProduct = (id: string) => {
    const next = buyable.find((p) => p.id === id)!;
    setProductId(id);
    setSize(sizesOf(next)[0]);
    setColor(next.colors?.[0] ?? "");
    setQuantity(quantitiesOf(next)[1]);
  };

  return (
    <section aria-labelledby="quick-buy-heading" className="relative z-10 container-custom -mt-28">
      <div className="rounded-xl bg-card shadow-[0_2px_4px_rgb(15_42_95/0.06),0_24px_48px_-24px_rgb(15_42_95/0.35)] p-5 md:px-7 md:py-6 grid gap-5 xl:grid-cols-[auto_minmax(0,1fr)_auto_auto] xl:gap-8 xl:items-center">
        <h2 id="quick-buy-heading" className="text-2xl font-extrabold leading-tight tracking-tight xl:max-w-[10ch]">Já sabe o que precisa?</h2>
        <div className={`grid gap-4 sm:grid-cols-3 ${product.colors?.length ? "lg:grid-cols-4" : ""}`}>
          <Field label="Material" id="qb-material" value={productId} onChange={changeProduct}>
            {buyable.map((p) => <option key={p.id} value={p.id}>{p.name.replace(/^Envelope /, "")}</option>)}
          </Field>
          <Field label="Tamanho" id="qb-size" value={size} onChange={setSize}>
            {sizes.map((s) => <option key={s} value={s}>{s.replace("x", " × ")} cm</option>)}
          </Field>
          {product.colors?.length ? (
            <Field label="Cor" id="qb-color" value={color} onChange={setColor}>
              {product.colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </Field>
          ) : null}
          <Field label="Quantidade" id="qb-quantity" value={String(quantity)} onChange={(v) => setQuantity(Number(v))}>
            {quantitiesOf(product).map((q) => <option key={q} value={q}>{q.toLocaleString("pt-BR")} un.</option>)}
          </Field>
        </div>
        <div className="xl:border-l xl:border-border xl:pl-8 min-w-[150px]" aria-live="polite">
          <b className="block text-[28px] font-extrabold tracking-tight tabular-nums leading-tight">{formatBRL(unitPrice * quantity)}</b>
          <span className="text-sm text-muted-foreground tabular-nums">{formatBRL(unitPrice)}/un.</span>
        </div>
        <button
          type="button"
          onClick={() => addToCart(buildCartProduct(product, quantity, size, color || undefined), quantity)}
          className="min-h-[54px] px-7 rounded-md bg-sun text-navy-dark font-bold hover:brightness-105 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </section>
  );
}
