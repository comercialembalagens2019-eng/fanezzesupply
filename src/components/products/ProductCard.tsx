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
            <p className="font-display text-xl font-bold text-primary">
              Consulte-nos
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              (47) 99149-0027
            </p>
            <p className="text-sm text-muted-foreground">
              vendas@fnzsupply.com.br
            </p>
          </div>

          {/* Contact CTA - replaces add to cart */}
          <div className="mt-auto">
            <div className="rounded-lg border border-border bg-secondary/40 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Para informações e cotação:
              </p>
              <a
                href="tel:+5547991490027"
                className="block font-semibold text-primary hover:underline"
              >
                (47) 99149-0027
              </a>
              <a
                href="mailto:vendas@fnzsupply.com.br"
                className="block text-sm text-primary hover:underline mt-1"
              >
                vendas@fnzsupply.com.br
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
