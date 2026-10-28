import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Product, CartItem } from "@/types";
import { toast } from "@/hooks/use-toast";
import { getUnitPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

const CART_STORAGE_KEY = "fanezze-cart";

// Shared by localStorage and the server copy; malformed entries are dropped.
export function parseCartItems(parsed: unknown): CartItem[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item.product?.id === "string" &&
        typeof item.product?.minOrder === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
  );
}

// A corrupted or outdated cart in localStorage must not crash the whole app.
function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return parseCartItems(saved ? JSON.parse(saved) : []);
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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // The server copy is only written after it was read for this user, so an empty
  // local cart never overwrites a saved one.
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (!userId) {
      setSyncedUserId(null);
      // Signing out leaves the cart saved on the account, not on a shared browser.
      if (previous) setItems([]);
      return;
    }

    let cancelled = false;
    supabase
      .from("carts")
      .select("items")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("Cart sync unavailable:", error.message);
          return;
        }
        const saved = parseCartItems(data?.items);
        // Items added before logging in win; otherwise restore the saved cart.
        setItems((local) => (local.length === 0 && saved.length > 0 ? saved : local));
        setSyncedUserId(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || syncedUserId !== userId) return;
    const timer = setTimeout(() => {
      supabase
        .from("carts")
        .upsert({ user_id: userId, items: items as unknown as Json })
        .then(({ error }) => {
          if (error) console.warn("Cart sync failed:", error.message);
        });
    }, 800);
    return () => clearTimeout(timer);
  }, [items, userId, syncedUserId]);

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
