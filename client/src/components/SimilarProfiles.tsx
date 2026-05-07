import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, InfluencerProfile } from "@/lib/api";

const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", macro: "tier-macro", celeb: "tier-celebrity",
};
const TIER_LABEL: Record<string, string> = {
  nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

export function SimilarProfiles({ currentId }: { currentId: string }) {
  const { data, isLoading } = useQuery<{ influencers: InfluencerProfile[] }>({
    queryKey: ["similar-influencers", currentId],
    queryFn: () => api.getSimilarInfluencers(currentId),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 h-28 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const profiles = data?.influencers ?? [];
  if (profiles.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Similar Creators</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {profiles.map((inf) => (
          <Link
            key={inf.id ?? inf._id}
            to={`/influencer/${inf.id ?? inf._id}`}
            className="w-36 shrink-0 bento-card p-3 rounded-xl hover:border-purple-500/30 transition-colors text-center block"
          >
            <img
              src={inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`}
              alt={inf.name}
              loading="lazy"
              className="w-12 h-12 rounded-full mx-auto mb-2 object-cover bg-charcoal"
            />
            <p className="text-xs font-medium text-chalk truncate">{inf.name}</p>
            {inf.tier && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CLASS[inf.tier] || ""}`}>
                {TIER_LABEL[inf.tier] ?? inf.tier}
              </span>
            )}
            {inf.avgRating && (
              <p className="text-[10px] text-gold mt-1">{Number(inf.avgRating).toFixed(1)} ★</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
