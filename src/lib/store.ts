// Simple cart store using React context
export interface Influencer {
  id: string;
  name: string;
  handle: string;
  photo: string;
  platform: "instagram" | "youtube";
  tier: "nano" | "micro" | "macro" | "celebrity";
  genre: string;
  city: string;
  followers: number;
  activeFollowers: number;
  fakeFollowers: number;
  avgViews: number;
  avgLikes: number;
  genderSplit: { male: number; female: number; other: number };
  price: number | null; // null = "Get in Touch"
}

export interface CartItem {
  influencer: Influencer;
  quantity: number;
}
