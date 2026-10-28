import { Fragment, useState } from "react";
import { productImageClass } from "@/lib/productImage";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { buildCartProduct } from "@/lib/pricing";

interface ProductCardProps {
  product: Product;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(price);

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>(product.colors?.[0] ?? "");
  const [quantity, setQuantity] = useState<number>(product.minOrder);

  const sizePricing = product.sizePricing?.find((sp) => sp.size === size);
  const unitPrice = sizePricing
    ? [...sizePricing.tiers]
        .sort((a, b) => a.minQty - b.minQty)
        .reduce((acc, tier) => (quantity >= tier.minQty ? tier.price : acc), sizePricing.tiers[0].price)
    : product.price;

  const needsSize = !!product.sizes?.length;
  const needsColor = !!product.colors?.length;
  const isValid =
    quantity >= product.minOrder && (!needsSize || !!size) && (!needsColor || !!color);

  const handleAdd = () => {
    if (!isValid) return;
    addToCart(buildCartProduct(product, quantity, size || undefined, color || undefined), quantity);
  };

  return (
    <div className="group tile p-3 hover:shadow-hover transition-shadow duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-2xl bg-card ring-1 ring-black/5 overflow-hidden grid place-items-center">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={300}
          height={225}
          className={`${productImageClass(product)} group-hover:scale-105 transition-transform duration-500`}
        />
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold">
          Mínimo: {product.minOrderLabel ?? `${product.minOrder} ${product.minOrderUnit}`}
        </div>
        {product.spec && (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-[11px] font-bold">
            {product.spec}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-2 pt-4 pb-2 flex-1 flex flex-col">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-display font-extrabold text-lg text-foreground mt-1 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
        </div>

        {product.quoteOnly ? (
          <div className="mt-auto rounded-2xl bg-muted p-4 text-center">
            <p className="font-display text-lg font-bold text-primary">Sob consulta</p>
            <p className="text-xs text-muted-foreground mt-1">
              Fale com nossa equipe para condições e prazos.
            </p>
          </div>
        ) : (
          <div className="mt-auto space-y-3">
            <p className="font-display text-2xl font-extrabold text-foreground">
              {formatPrice(unitPrice)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {product.unit}
              </span>
            </p>

            {product.sizePricing && (
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Tabela de preços (por unidade)</p>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Tamanho (cm)</span>
                  <span className="font-medium text-muted-foreground text-right">500 un.</span>
                  <span className="font-medium text-muted-foreground text-right">1.000+ un.</span>
                  {product.sizePricing.map((sp) => (
                    <Fragment key={sp.size}>
                      <span className={sp.size === size ? "font-semibold text-primary" : "text-foreground"}>{sp.size}</span>
                      <span className="text-right text-foreground">{formatPrice(sp.tiers[0].price)}</span>
                      <span className="text-right text-foreground">{formatPrice(sp.tiers[sp.tiers.length - 1].price)}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
            )}

            {needsSize && (
              <div className="space-y-1.5">
                <Label htmlFor={`size-${product.id}`}>Tamanho</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger id={`size-${product.id}`} className="bg-background">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes!.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsColor && (
              <div className="space-y-1.5">
                <Label htmlFor={`color-${product.id}`}>Cor</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger id={`color-${product.id}`} className="bg-background">
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.colors!.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`qty-${product.id}`}>
                Quantidade ({product.minOrderUnit})
              </Label>
              <Input
                id={`qty-${product.id}`}
                type="number"
                min={product.minOrder}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="bg-background"
              />
              {quantity < product.minOrder && (
                <p className="text-xs text-destructive">
                  Pedido mínimo: {product.minOrder} {product.minOrderUnit}
                </p>
              )}
            </div>

            <Button className="w-full gap-2 h-11 rounded-xl font-bold" onClick={handleAdd} disabled={!isValid}>
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao carrinho
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
