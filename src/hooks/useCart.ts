import { useState, useCallback } from "react";
import { Influencer, CartItem } from "@/lib/store";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((influencer: Influencer) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.influencer.id === influencer.id);
      if (existing) return prev;
      return [...prev, { influencer, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.influencer.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.influencer.id === id),
    [items]
  );

  const total = items.reduce((sum, i) => sum + (i.influencer.price ?? 0), 0);

  return { items, addToCart, removeFromCart, clearCart, isInCart, total, count: items.length };
}
