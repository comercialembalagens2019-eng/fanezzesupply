import { useState } from "react";
import { ShoppingCart, Plus, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(product.minOrder);
  const { addToCart } = useCart();
  const isMinMet = quantity >= product.minOrder;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (isMinMet) {
      addToCart(product, quantity);
      setQuantity(product.minOrder);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
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
        {/* Min Order Badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          Mínimo: {product.minOrder} {product.minOrderUnit}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-display font-semibold text-foreground mt-1 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {product.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="font-display text-2xl font-bold text-primary">
            {formatPrice(product.price)}
            <span className="text-sm font-normal text-muted-foreground">
              /{product.unit}
            </span>
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="h-10 w-10"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 h-10 text-center border border-border rounded-lg bg-background text-foreground font-semibold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(1)}
              className="h-10 w-10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Min Order Warning */}
          {!isMinMet && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>
                Pedido mínimo: {product.minOrder} {product.minOrderUnit}
              </span>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!isMinMet}
            className={cn(
              "w-full gap-2",
              isMinMet ? "bg-primary hover:bg-navy-light" : "opacity-50"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
