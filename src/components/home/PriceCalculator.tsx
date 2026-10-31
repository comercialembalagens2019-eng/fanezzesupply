import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { bestTierDiscount, buildCartProduct, formatBRL, getUnitPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// Only products sold online with a size choice or a flat price.
const calculatorProducts = products.filter((p) => !p.quoteOnly && !p.adminOnly && !p.colors?.length);

const bestTierMinQty = (product: (typeof products)[number]) => {
  const tiers = product.sizePricing?.[0]?.tiers ?? [];
  return Math.max(...tiers.map((t) => t.minQty));
};

export function PriceCalculator() {
  const { addToCart } = useCart();
  const [productId, setProductId] = useState(calculatorProducts[0].id);
  const product = calculatorProducts.find((p) => p.id === productId)!;
  const sizes = product.sizePricing?.map((sp) => sp.size) ?? [];
  const [size, setSize] = useState(sizes[0] ?? "");
  const presets = [product.minOrder, product.minOrder * 2, product.minOrder * 4];
  const [quantity, setQuantity] = useState(presets[1]);

  const activeSize = sizes.includes(size) ? size : sizes[0];
  const variantId = activeSize ? `${product.id}-${activeSize}` : product.id;
  const unitPrice = getUnitPrice(variantId, quantity, product.price);
  const total = unitPrice * quantity;
  const discount = useMemo(() => bestTierDiscount(product), [product]);

  const handleProductChange = (id: string) => {
    const next = calculatorProducts.find((p) => p.id === id)!;
    setProductId(id);
    setSize(next.sizePricing?.[0]?.size ?? "");
    setQuantity(next.minOrder * 2);
  };

  const selectClass =
    "w-full min-h-11 bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer";

  return (
    <div className="tile p-6 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold text-base">Calculadora de preço</h2>
        {discount > 0 && (
          <span className="text-xs font-bold text-success-soft-foreground bg-success-soft px-2 py-1 rounded-full whitespace-nowrap">
            −{Math.round(discount * 100)}% em {bestTierMinQty(product).toLocaleString("pt-BR")}+
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
        <label className="rounded-xl bg-muted p-3 focus-within:ring-2 focus-within:ring-ring">
          <span className="text-muted-foreground text-xs block">Produto</span>
          <select aria-label="Produto" className={selectClass} value={productId} onChange={(e) => handleProductChange(e.target.value)}>
            {calculatorProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className={cn("rounded-xl bg-muted p-3 focus-within:ring-2 focus-within:ring-ring", !sizes.length && "opacity-60")}>
          <span className="text-muted-foreground text-xs block">Tamanho</span>
          {sizes.length ? (
            <select aria-label="Tamanho" className={selectClass} value={activeSize} onChange={(e) => setSize(e.target.value)}>
              {sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-bold block">{product.spec ?? "Único"}</span>
          )}
        </label>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-sm font-bold" role="group" aria-label={`Quantidade (${product.minOrderUnit})`}>
        {presets.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuantity(q)}
            aria-pressed={quantity === q}
            className={cn(
              "min-h-11 py-2.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              quantity === q ? "bg-primary text-primary-foreground" : "ring-1 ring-black/10 hover:bg-muted"
            )}
          >
            {q.toLocaleString("pt-BR")}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-5 flex items-end justify-between gap-3 border-t border-dashed border-border">
        <div>
          <span className="text-xs text-muted-foreground">Total estimado</span>
          <div className="text-3xl font-extrabold tabular-nums" aria-live="polite">{formatBRL(total)}</div>
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatBRL(unitPrice)}/{product.unit === "kg" ? "kg" : "un."}
        </span>
      </div>

      <button
        type="button"
        onClick={() => addToCart(buildCartProduct(product, quantity, activeSize), quantity)}
        className="mt-4 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-light transition-colors"
      >
        <ShoppingCart className="w-4 h-4" aria-hidden="true" />
        Adicionar ao carrinho
      </button>
    </div>
  );
}
