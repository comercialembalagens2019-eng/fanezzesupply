import { Fragment, useState } from "react";
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
    const suffix = [size, color].filter(Boolean).join(" • ");
    addToCart(
      {
        ...product,
        id: [product.id, size, color].filter(Boolean).join("-"),
        name: suffix ? `${product.name} - ${suffix}` : product.name,
        price: unitPrice,
      },
      quantity
    );
  };

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card hover:border-primary/20 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          Mínimo: {product.minOrderLabel ?? `${product.minOrder} ${product.minOrderUnit}`}
        </div>
        {product.spec && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            {product.spec}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-display font-semibold text-foreground mt-1 mb-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
        </div>

        {product.quoteOnly ? (
          <div className="mt-auto rounded-lg border border-border bg-secondary/40 p-4 text-center">
            <p className="font-display text-lg font-bold text-primary">Sob consulta</p>
            <p className="text-xs text-muted-foreground mt-1">
              Fale com nossa equipe para condições e prazos.
            </p>
          </div>
        ) : (
          <div className="mt-auto space-y-3">
            <p className="font-display text-xl font-bold text-primary">
              {formatPrice(unitPrice)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {product.unit}
              </span>
            </p>

            {product.sizePricing && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
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

            <Button className="w-full gap-2" onClick={handleAdd} disabled={!isValid}>
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao carrinho
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
