import { useState, useCallback, useEffect } from "react";
import { Influencer, CartItem } from "@/lib/store";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useCart() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [campaignName, setCampaignName] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
      setCampaignName("");
      setCampaignId("");
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getCart() as unknown as { cart?: { items?: Array<{ influencerId: { _id?: string; name?: string } | string; price: number; campaignId?: { _id?: string; title?: string } | string }> } };
      if (data?.cart?.items) {
        const loadedItems: CartItem[] = data.cart.items.map((item) => ({
          influencer: {
            id: item.influencerId?._id || item.influencerId,
            name: item.influencerId?.name || "Unknown",
            photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (item.influencerId?._id || "default"),
            handle: "",
            platform: "instagram" as const,
            tier: "micro" as const,
            genre: "",
            city: "",
            followers: 0,
            activeFollowers: 0,
            fakeFollowers: 0,
            avgViews: 0,
            avgLikes: 0,
            genderSplit: { male: 50, female: 50, other: 0 },
            price: item.price,
          },
          quantity: 1,
        }));
        setItems(loadedItems);
        
        if (data.cart.items[0]?.campaignId) {
          setCampaignId(data.cart.items[0].campaignId._id || data.cart.items[0].campaignId);
          setCampaignName(data.cart.items[0].campaignId?.title || "");
        }
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (influencer: Influencer) => {
    const existing = items.find((i) => i.influencer.id === influencer.id);
    if (existing) return;

    const newItem: CartItem = { influencer, quantity: 1 };
    
    setItems((prev) => [...prev, newItem]);

    if (user) {
      try {
        await api.addToCart(influencer.id, influencer.price || 0, campaignId);
      } catch (err) {
        console.error("Failed to add to cart:", err);
        setItems((prev) => prev.filter((i) => i.influencer.id !== influencer.id));
      }
    }
  }, [items, user, campaignId]);

  const removeFromCart = useCallback(async (id: string) => {
    const removed = items.find((i) => i.influencer.id === id);
    
    setItems((prev) => prev.filter((i) => i.influencer.id !== id));

    if (user) {
      try {
        await api.removeFromCart(id);
      } catch (err) {
        console.error("Failed to remove from cart:", err);
        if (removed) {
          setItems((prev) => [...prev, removed]);
        }
      }
    }
  }, [items, user]);

  const clearCart = useCallback(async () => {
    const previousItems = [...items];
    
    setItems([]);
    setCampaignName("");
    setCampaignId("");

    if (user) {
      try {
        await api.clearCart();
      } catch (err) {
        console.error("Failed to clear cart:", err);
        setItems(previousItems);
      }
    }
  }, [items, user]);

  const setCampaign = useCallback(async (name: string, id: string = "") => {
    setCampaignName(name);
    setCampaignId(id);

    if (user && items.length > 0) {
      try {
        for (const item of items) {
          if (id) {
            await api.updateCartItem(item.influencer.id, id, item.influencer.price || 0);
          }
        }
      } catch (err) {
        console.error("Failed to update campaign:", err);
      }
    }
  }, [user, items]);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.influencer.id === id),
    [items]
  );

  const total = items.reduce((sum, i) => sum + (i.influencer.price ?? 0), 0);

  return { 
    items, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    isInCart, 
    total, 
    count: items.length,
    campaignName,
    campaignId,
    setCampaign,
    loading,
  };
}
