import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

export function RecommendedCreators() {
  const { data: creators = [] } = useQuery({
    queryKey: ["recommended-creators"],
    queryFn: () => api.getRecommendedCreators(),
    staleTime: 5 * 60_000,
  });

  if (creators.length === 0) return null;

  return (
    <div className="bento-card p-5">
      <h2 className="font-display font-bold text-chalk mb-4">Recommended Creators</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {creators.map((c) => (
          <Link key={c.id} to={`/influencer/${c.id}`}
            className="flex-shrink-0 w-36 bento-card-dark p-3 rounded-xl hover:border-purple-500/30 transition-colors text-center block">
            <img
              src={c.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`}
              alt={c.name} loading="lazy"
              className="w-12 h-12 rounded-full mx-auto mb-2 object-cover bg-charcoal"
            />
            <p className="text-xs font-medium text-chalk truncate">{c.name}</p>
            <p className="text-[10px] text-chalk-dim truncate mt-0.5">{c.niches?.[0] || c.tier || "—"}</p>
            {c.avgRating && (
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                <span className="text-[10px] text-gold">{Number(c.avgRating).toFixed(1)}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
