import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { buildCartProduct, formatBRL, getUnitPrice } from "@/lib/pricing";

// Most re-ordered variants; each row adds straight to the cart.
const QUICK_ITEMS = [
  { productId: "envelope-coex", size: "19x25", step: 500 },
  { productId: "envelope-cinza", size: "32x40", step: 500 },
  { productId: "stretch-4kg", size: undefined, step: 50 },
];

function QuickOrderRow({ productId, size, step }: (typeof QUICK_ITEMS)[number]) {
  const { addToCart } = useCart();
  const product = products.find((p) => p.id === productId)!;
  const [quantity, setQuantity] = useState(product.minOrder);
  const variantId = size ? `${product.id}-${size}` : product.id;
  const unitPrice = getUnitPrice(variantId, quantity, product.price);
  const unit = product.unit === "kg" ? "kg" : "un.";
  const label = size ? `${product.name} ${size}` : product.name;
  const tier = product.sizePricing?.[0]?.tiers
    .filter((t) => quantity >= t.minQty)
    .reduce((acc, t) => Math.max(acc, t.minQty), 0);

  return (
    <div className="p-4 md:px-6 grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_auto_auto] items-center gap-3 md:gap-6">
      <div>
        <b className="font-bold">{label}</b>
        <span className="block text-xs text-muted-foreground">
          mín. {product.minOrder.toLocaleString("pt-BR")} {unit} · {formatBRL(unitPrice)}/{unit}
        </span>
      </div>
      <span className="hidden md:block text-sm text-muted-foreground">
        {tier ? `Faixa: ${tier.toLocaleString("pt-BR")}+` : "Preço único"}
      </span>
      <div className="flex items-center rounded-xl ring-1 ring-black/10 overflow-hidden text-sm font-bold">
        <button
          type="button"
          className="w-10 h-10 grid place-items-center hover:bg-muted disabled:opacity-40"
          onClick={() => setQuantity((q) => Math.max(product.minOrder, q - step))}
          disabled={quantity <= product.minOrder}
          aria-label={`Diminuir quantidade de ${label}`}
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <span className="w-16 text-center tabular-nums" aria-live="polite">{quantity.toLocaleString("pt-BR")}</span>
        <button
          type="button"
          className="w-10 h-10 grid place-items-center hover:bg-muted"
          onClick={() => setQuantity((q) => q + step)}
          aria-label={`Aumentar quantidade de ${label}`}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-end gap-4">
        <b className="text-lg tabular-nums">{formatBRL(unitPrice * quantity)}</b>
        <button
          type="button"
          onClick={() => addToCart(buildCartProduct(product, quantity, size), quantity)}
          className="bg-primary text-primary-foreground font-bold text-sm px-4 h-10 rounded-xl hover:bg-navy-light transition-colors"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

export function QuickOrder() {
  return (
    <section className="container-custom mt-10" aria-labelledby="quick-order-heading">
      <div className="flex items-end justify-between mb-4">
        <h2 id="quick-order-heading" className="text-2xl font-extrabold">Pedido rápido</h2>
        <Link to="/produtos" className="text-sm font-bold text-navy-light flex items-center gap-1 hover:text-foreground">
          Ver catálogo <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="tile divide-y divide-border">
        {QUICK_ITEMS.map((item) => (
          <QuickOrderRow key={item.productId} {...item} />
        ))}
      </div>
    </section>
  );
}
