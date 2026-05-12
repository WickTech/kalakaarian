import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Star } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";
import { useCartContext } from "@/contexts/CartContext";
import { Influencer } from "@/lib/store";

const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", macro: "tier-macro", celeb: "tier-celebrity",
};
const TIER_LABEL: Record<string, string> = {
  nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

function minPrice(pricing?: Record<string, number>): number | null {
  if (!pricing) return null;
  const vals = Object.values(pricing).filter((v) => v > 0);
  return vals.length ? Math.min(...vals) : null;
}

function toCartInfluencer(inf: InfluencerProfile): Influencer {
  return {
    id: (inf.id ?? inf._id)!,
    name: inf.name ?? "Unknown",
    handle: inf.socialHandles?.instagram ?? inf.socialHandles?.youtube ?? "",
    photo: inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`,
    platform: (inf.platform?.[0] === "youtube" ? "youtube" : "instagram") as "instagram" | "youtube",
    tier: (inf.tier ?? "nano") as "nano" | "micro" | "macro" | "celeb",
    genre: inf.niches?.[0] ?? "",
    city: inf.city ?? "",
    followers: inf.followerCount ?? 0,
    activeFollowers: 0,
    fakeFollowers: 0,
    avgViews: 0,
    avgLikes: 0,
    genderSplit: { male: 50, female: 50, other: 0 },
    price: minPrice(inf.pricing),
    isOnline: inf.isOnline,
    lastSeenAt: inf.lastSeenAt,
    avgRating: inf.avgRating,
    ratingCount: inf.ratingCount,
  };
}

function SimilarCreatorCard({ inf }: { inf: InfluencerProfile }) {
  const { addToCart, isInCart } = useCartContext();
  const id = inf.id ?? inf._id ?? "";
  const inCart = isInCart(id);
  const price = minPrice(inf.pricing);
  const cartInfluencer = toCartInfluencer(inf);
  const isCeleb = inf.tier === "celeb";

  return (
    <div className="group relative flex flex-col bento-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(147,51,234,0.18)] hover:-translate-y-1 hover:border-purple-500/40">
      {/* Profile image */}
      <Link to={`/influencer/${id}`} className="block relative">
        <div className="relative h-32 bg-gradient-to-br from-purple-900/30 to-charcoal overflow-hidden">
          <img
            src={inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`}
            alt={inf.name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent" />
        </div>
        {inf.isOnline && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-obsidian" title="Online" />
        )}
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div>
          <Link
            to={`/influencer/${id}`}
            className="font-semibold text-sm text-chalk hover:text-gold transition-colors truncate block leading-tight"
          >
            {inf.name}
          </Link>
          {inf.niches?.[0] && (
            <p className="text-[10px] text-chalk-faint truncate mt-0.5">{inf.niches[0]}</p>
          )}
        </div>

        {/* Tier + rating row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {inf.tier && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TIER_CLASS[inf.tier] || ""}`}>
              {TIER_LABEL[inf.tier] ?? inf.tier}
            </span>
          )}
          {inf.avgRating != null && (
            <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium ml-auto">
              <Star className="w-2.5 h-2.5 fill-green-400" />
              {Number(inf.avgRating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-center">
          <div className="flex-1 bento-card-dark rounded-lg py-1.5">
            <p className="text-[9px] text-chalk-faint">Followers</p>
            <p className="text-xs font-bold text-chalk">
              {inf.followerCount
                ? inf.followerCount >= 1_000_000
                  ? `${(inf.followerCount / 1_000_000).toFixed(1)}M`
                  : `${(inf.followerCount / 1000).toFixed(0)}K`
                : "—"}
            </p>
          </div>
          <div className="flex-1 bento-card-dark rounded-lg py-1.5">
            <p className="text-[9px] text-chalk-faint">From</p>
            <p className="text-xs font-bold text-chalk">
              {price != null ? `₹${price.toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
        </div>

        {/* Cart button */}
        {isCeleb ? (
          <Link
            to={`/influencer/${id}`}
            className="mt-auto w-full py-1.5 text-[10px] rounded-full font-bold border border-gold/40 text-gold hover:bg-gold/10 transition-all text-center"
          >
            Get In Touch
          </Link>
        ) : (
          <button
            onClick={() => { if (!inCart) addToCart(cartInfluencer); }}
            disabled={inCart}
            className={`mt-auto w-full py-1.5 text-[10px] rounded-full font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
              inCart
                ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                : "purple-pill hover:shadow-[0_0_12px_rgba(147,51,234,0.4)]"
            }`}
          >
            {inCart ? (
              <><Check className="w-3 h-3" /> Added</>
            ) : (
              <><ShoppingCart className="w-3 h-3" /> Add to Cart</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SimilarProfilesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bento-card animate-pulse">
          <div className="h-32 bg-white/5" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/5 rounded w-3/4" />
            <div className="h-2 bg-white/5 rounded w-1/2" />
            <div className="h-8 bg-white/5 rounded" />
            <div className="h-7 bg-white/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimilarProfiles({ currentId }: { currentId: string }) {
  const { data, isLoading } = useQuery<{ influencers: InfluencerProfile[] }>({
    queryKey: ["similar-influencers", currentId],
    queryFn: () => api.getSimilarInfluencers(currentId),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Similar Creators</h2>
      <SimilarProfilesSkeleton />
    </div>
  );

  const profiles = data?.influencers ?? [];
  if (profiles.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Similar Creators</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {profiles.map((inf) => (
          <SimilarCreatorCard key={inf.id ?? inf._id} inf={inf} />
        ))}
      </div>
    </div>
  );
}
