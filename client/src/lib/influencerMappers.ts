import { InfluencerProfile } from "@/lib/api";
import { Influencer } from "@/lib/store";

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];

export const parseUrlTier = (raw: string | null): Tier | "all" => {
  if (!raw) return "all";
  const lower = raw.toLowerCase();
  if (lower === "mega") return "celeb";
  if ((TIERS as readonly string[]).includes(lower)) return lower as Tier;
  return "all";
};

export const toInfluencer = (inf: InfluencerProfile): Influencer => {
  const connected: Array<"instagram" | "youtube"> = [];
  if (inf.socialHandles?.instagram) connected.push("instagram");
  if (inf.socialHandles?.youtube) connected.push("youtube");
  const primary: "instagram" | "youtube" =
    connected[0] ?? ((inf.platform?.[0] as "instagram" | "youtube") || "instagram");
  return {
    id: inf.id ?? inf._id ?? "",
    name: inf.username || inf.name || "",
    handle: inf.socialHandles?.instagram || inf.socialHandles?.youtube || "",
    photo: inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`,
    platform: primary,
    connectedPlatforms: connected,
    tier: (inf.tier as Tier) || "nano",
    genre: inf.niches?.[0] || "",
    niches: inf.niches || [],
    city: inf.city || "",
    followers: inf.followerCount || 0, activeFollowers: 0, fakeFollowers: 0,
    avgViews: 0, avgLikes: 0,
    genderSplit: { male: 45, female: 52, other: 3 },
    price: inf.pricing ? (Math.min(...Object.values(inf.pricing).filter(v => v > 0)) || null) : null,
    isOnline: inf.isOnline, lastSeenAt: inf.lastSeenAt,
    avgRating: inf.avgRating ?? null, ratingCount: inf.ratingCount ?? 0,
  };
};
