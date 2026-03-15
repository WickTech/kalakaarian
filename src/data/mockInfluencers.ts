export type InfluencerNiche =
  | "Fashion"
  | "Beauty"
  | "Tech"
  | "Travel"
  | "Food"
  | "Fitness"
  | "Gaming"
  | "Lifestyle"
  | "Finance"
  | "Other";

export interface RegisteredInfluencer {
  id: string;
  fullName: string;
  bio: string;
  niches: InfluencerNiche[];
  instagramHandle?: string;
  youtubeUrl?: string;
  tiktokHandle?: string;
  twitterHandle?: string;
  instagramFollowers?: number;
  youtubeSubscribers?: number;
  tiktokFollowers?: number;
  engagementRate?: number;
}

export const mockInfluencers: RegisteredInfluencer[] = [
  {
    id: "inf-1",
    fullName: "Aisha Kapoor",
    bio: "Fashion and beauty creator sharing affordable style tips and skincare routines.",
    niches: ["Fashion", "Beauty", "Lifestyle"],
    instagramHandle: "@aishastyled",
    youtubeUrl: "https://youtube.com/@aishastyled",
    instagramFollowers: 182000,
    youtubeSubscribers: 43000,
    engagementRate: 5.7,
  },
  {
    id: "inf-2",
    fullName: "Rohan Mehta",
    bio: "Tech reviewer breaking down gadgets, apps, and AI tools for everyday users.",
    niches: ["Tech", "Gaming"],
    instagramHandle: "@rohanreviews",
    youtubeUrl: "https://youtube.com/@rohanreviews",
    twitterHandle: "@rohan_techx",
    youtubeSubscribers: 265000,
    instagramFollowers: 78000,
    engagementRate: 6.1,
  },
  {
    id: "inf-3",
    fullName: "Maya Singh",
    bio: "Travel and food storyteller discovering hidden gems across India and beyond.",
    niches: ["Travel", "Food", "Lifestyle"],
    instagramHandle: "@mapwithmaya",
    tiktokHandle: "@mapwithmaya",
    instagramFollowers: 94000,
    tiktokFollowers: 137000,
    engagementRate: 4.9,
  },
  {
    id: "inf-4",
    fullName: "Dev Arora",
    bio: "Fitness coach focused on strength, mobility, and practical nutrition for busy professionals.",
    niches: ["Fitness", "Lifestyle"],
    instagramHandle: "@devgetsfit",
    youtubeUrl: "https://youtube.com/@devgetsfit",
    instagramFollowers: 51000,
    youtubeSubscribers: 22000,
    engagementRate: 7.2,
  },
  {
    id: "inf-5",
    fullName: "Sara Fernandes",
    bio: "Finance educator simplifying money habits, investing basics, and side hustles.",
    niches: ["Finance", "Other"],
    twitterHandle: "@saramoneywise",
    youtubeUrl: "https://youtube.com/@saramoneywise",
    youtubeSubscribers: 118000,
    engagementRate: 5.1,
  },
  {
    id: "inf-6",
    fullName: "Kabir Jain",
    bio: "Gaming creator livestreaming esports, reviews, and creator economy insights.",
    niches: ["Gaming", "Tech"],
    youtubeUrl: "https://youtube.com/@kabirplays",
    tiktokHandle: "@kabirplays",
    youtubeSubscribers: 402000,
    tiktokFollowers: 98000,
    engagementRate: 8.4,
  },
];
