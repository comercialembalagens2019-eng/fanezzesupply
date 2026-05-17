import { useState } from "react";
import { ShoppingCart, Plus, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { SizeSelectionModal } from "./SizeSelectionModal";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(product.minOrder);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToCart } = useCart();
  const isMinMet = quantity >= product.minOrder;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product.hasVariations) {
      setModalOpen(true);
      return;
    }

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
    <>
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
          {/* Variations Badge */}
          {product.hasVariations && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
              Vários tamanhos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Fixed height content area */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {product.category}
            </span>
            <h3 className="font-display font-semibold text-foreground mt-1 mb-2 h-12 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground h-10 line-clamp-2 mb-4">
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

          {/* Actions Container - Fixed height to align buttons */}
          <div className="mt-auto">
            {/* Quantity Selector - Only show for products without variations */}
            {!product.hasVariations ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Diminuir quantidade"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-10 w-10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <input
                    type="number"
                    aria-label="Quantidade"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20 h-10 text-center border border-border rounded-lg bg-background text-foreground font-semibold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Aumentar quantidade"
                    onClick={() => handleQuantityChange(1)}
                    className="h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Min Order Warning */}
                <div className="h-5">
                  {!isMinMet && (
                    <div className="flex items-center gap-2 text-destructive text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        Pedido mínimo: {product.minOrder} {product.minOrderUnit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Spacer for products with variations to align buttons */
              <div className="h-[72px]" />
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!product.hasVariations && !isMinMet}
              className={cn(
                "w-full gap-2 mt-3",
                !product.hasVariations && isMinMet
                  ? "bg-primary hover:bg-navy-light"
                  : product.hasVariations
                  ? "bg-primary hover:bg-navy-light"
                  : "opacity-50"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              {product.hasVariations ? "Selecionar Tamanho" : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </div>
      </div>

      {/* Size Selection Modal */}
      {product.hasVariations && (
        <SizeSelectionModal
          product={product}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </>
  );
}
