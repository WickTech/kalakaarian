import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";

export function RisingStarsCarousel() {
  const [stars, setStars] = useState<InfluencerProfile[]>([]);

  useEffect(() => {
    api.searchInfluencers({ limit: 12 } as Parameters<typeof api.searchInfluencers>[0])
      .then((data) => {
        const sorted = (Array.isArray(data) ? data : [])
          .filter((i) => i.followerCount && i.followerCount > 0)
          .sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0))
          .slice(0, 10);
        setStars(sorted);
      })
      .catch(() => {});
  }, []);

  if (!stars.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
        <span className="text-xs font-bold text-chalk uppercase tracking-wider">Rising Stars</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {stars.map((inf) => (
          <Link
            key={inf.id ?? inf._id}
            to={`/influencer/${inf.id ?? inf._id}`}
            className="shrink-0 snap-start flex flex-col items-center gap-1.5 w-16"
          >
            <div className="relative">
              <img
                src={inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`}
                alt={inf.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gold/60 bg-charcoal"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-obsidian fill-obsidian" />
              </span>
            </div>
            <span className="text-[10px] text-chalk-dim text-center truncate w-full leading-tight">{inf.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
