import { api } from "./axios";
import { Influencer } from "@/lib/store";

export interface CartItemResponse {
  id: string;
  influencer: Influencer;
  quantity: number;
  addedAt: string;
}

export interface CartResponse {
  cart: {
    items: CartItemResponse[];
    total: number;
  };
}

export const cartAPI = {
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get<CartResponse>("/cart");
    return response.data;
  },

  addToCart: async (influencerId: string): Promise<CartResponse> => {
    const response = await api.post<CartResponse>("/cart/add", { influencerId });
    return response.data;
  },

  removeFromCart: async (influencerId: string): Promise<CartResponse> => {
    const response = await api.delete<CartResponse>(`/cart/remove/${influencerId}`);
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete("/cart/clear");
  },

  updateQuantity: async (influencerId: string, quantity: number): Promise<CartResponse> => {
    const response = await api.put<CartResponse>(`/cart/update/${influencerId}`, { quantity });
    return response.data;
  },
};
