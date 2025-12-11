import { useState, useMemo } from "react";
import { X, ShoppingCart, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";

interface SizeSelectionModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SizeSelectionModal({
  product,
  open,
  onOpenChange,
}: SizeSelectionModalProps) {
  const { addToCart } = useCart();
  const [selectedThickness, setSelectedThickness] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(product.minOrder);

  const thicknesses = useMemo(() => {
    if (!product.variations) return [];
    return product.variations.map((v) => v.thickness);
  }, [product.variations]);

  const availableSizes = useMemo(() => {
    if (!product.variations || !selectedThickness) return [];
    const variation = product.variations.find(
      (v) => v.thickness === selectedThickness
    );
    return variation?.sizes || [];
  }, [product.variations, selectedThickness]);

  const isMinMet = quantity >= product.minOrder;
  const isFormValid = selectedThickness && selectedSize && isMinMet;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const totalPrice = product.price * quantity;

  const handleThicknessChange = (value: string) => {
    setSelectedThickness(value);
    setSelectedSize(""); // Reset size when thickness changes
  };

  const handleAddToCart = () => {
    if (!isFormValid) return;

    // Create a product variant with the selected size in the name
    const productVariant: Product = {
      ...product,
      id: `${product.id}-${selectedSize}`, // Unique ID for this variant
      name: `${product.name} - ${selectedSize}`,
    };

    addToCart(productVariant, quantity);
    onOpenChange(false);

    // Reset form
    setSelectedThickness("");
    setSelectedSize("");
    setQuantity(product.minOrder);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedThickness("");
    setSelectedSize("");
    setQuantity(product.minOrder);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Selecione as especificações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatPrice(product.price)}/{product.unit}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                Mínimo: {product.minOrder}
                {product.minOrderUnit}
              </span>
            </div>
          </div>

          {/* Thickness Select */}
          <div className="space-y-2">
            <Label htmlFor="thickness">Espessura</Label>
            <Select
              value={selectedThickness}
              onValueChange={handleThicknessChange}
            >
              <SelectTrigger id="thickness" className="bg-background">
                <SelectValue placeholder="Selecione a espessura" />
              </SelectTrigger>
              <SelectContent>
                {thicknesses.map((thickness) => (
                  <SelectItem key={thickness} value={thickness}>
                    {thickness}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Select */}
          <div className="space-y-2">
            <Label htmlFor="size">Tamanho</Label>
            <Select
              value={selectedSize}
              onValueChange={setSelectedSize}
              disabled={!selectedThickness}
            >
              <SelectTrigger
                id="size"
                className="bg-background"
                disabled={!selectedThickness}
              >
                <SelectValue
                  placeholder={
                    selectedThickness
                      ? "Selecione o tamanho"
                      : "Selecione primeiro a espessura"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade em kg</Label>
            <Input
              id="quantity"
              type="number"
              min={product.minOrder}
              step={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="bg-background"
            />
            {!isMinMet && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Pedido mínimo de {product.minOrder}kg</span>
              </div>
            )}
          </div>

          {/* Total Price */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-display text-2xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={!isFormValid}
            >
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
