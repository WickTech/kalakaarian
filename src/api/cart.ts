import { api } from "./axios";
import { Influencer } from "@/lib/store";

export interface CartItemResponse {
  id: string;
  influencer: Influencer;
  quantity: number;
  addedAt: string;
}

export interface CartResponse {
  items: CartItemResponse[];
  total: number;
  itemCount: number;
}

export const cartAPI = {
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get<CartResponse>("/cart");
    return response.data;
  },

  addToCart: async (influencerId: string): Promise<CartResponse> => {
    const response = await api.post<CartResponse>("/cart", { influencerId });
    return response.data;
  },

  removeFromCart: async (itemId: string): Promise<CartResponse> => {
    const response = await api.delete<CartResponse>(`/cart/${itemId}`);
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete("/cart");
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<CartResponse> => {
    const response = await api.patch<CartResponse>(`/cart/${itemId}`, { quantity });
    return response.data;
  },
};
