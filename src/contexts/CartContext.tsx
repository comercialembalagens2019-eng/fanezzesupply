import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, CartItem } from "@/types";
import { toast } from "@/hooks/use-toast";

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
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("fanezze-cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("fanezze-cart", JSON.stringify(items));
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

    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        toast({
          title: "Carrinho atualizado",
          description: `${product.name} atualizado para ${newQuantity} ${product.minOrderUnit}.`,
        });
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      toast({
        title: "Produto adicionado",
        description: `${product.name} foi adicionado ao carrinho.`,
      });
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (item) {
        toast({
          title: "Produto removido",
          description: `${item.product.name} foi removido do carrinho.`,
        });
      }
      return prev.filter((item) => item.product.id !== productId);
    });
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
      (total, item) => total + item.product.price * item.quantity,
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
