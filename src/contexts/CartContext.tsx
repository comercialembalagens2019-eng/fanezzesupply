import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, CartItem } from "@/types";
import { toast } from "@/hooks/use-toast";
import { getUnitPrice } from "@/lib/pricing";

const CART_STORAGE_KEY = "fanezze-cart";

// A corrupted or outdated cart in localStorage must not crash the whole app.
function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item.product?.id === "string" &&
        typeof item.product?.minOrder === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isMinOrderMet: (productId: string) => boolean;
  allMinOrdersMet: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be full or blocked; the cart still works for this visit.
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number) => {
    if (quantity < product.minOrder) {
      toast({
        title: "Quantidade insuficiente",
        description: `O pedido mínimo para ${product.name} é de ${product.minOrder} ${product.minOrderUnit}.`,
        variant: "destructive",
      });
      return;
    }

    // Toasts stay outside the state updater, which React may run twice.
    const existingItem = items.find((item) => item.product.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
      toast({
        title: "Carrinho atualizado",
        description: `${product.name} atualizado para ${newQuantity} ${product.minOrderUnit}.`,
      });
      return;
    }

    setItems((prev) => [...prev, { product, quantity }]);
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const removeFromCart = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    if (item) {
      toast({
        title: "Produto removido",
        description: `${item.product.name} foi removido do carrinho.`,
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho.",
    });
  };

  const getTotal = () => {
    return items.reduce(
      // Tier prices depend on the current quantity, so recompute instead of using the add-time price.
      (total, item) => total + getUnitPrice(item.product.id, item.quantity, item.product.price) * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const isMinOrderMet = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    if (!item) return false;
    return item.quantity >= item.product.minOrder;
  };

  const allMinOrdersMet = () => {
    return items.every((item) => item.quantity >= item.product.minOrder);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        isMinOrderMet,
        allMinOrdersMet,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
