import { Link } from "react-router-dom";
import { CheckSquare, Star, Check, MapPin, Instagram, Youtube } from "lucide-react";
import { Influencer } from "@/lib/store";

const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", macro: "tier-macro", celeb: "tier-celebrity",
};
const TIER_LABEL: Record<string, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

function fmt(n: number): string {
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function fmtPrice(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

interface Props {
  inf: Influencer;
  selected: boolean;
  inCart: boolean;
  onToggleSelect: () => void;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  onGetInTouch: () => void;
}

export function CreatorCard({ inf, selected, inCart, onToggleSelect, onAddToCart, onRemoveFromCart, onGetInTouch }: Props) {
  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) onRemoveFromCart();
    else onAddToCart();
  };

  const genres = inf.niches && inf.niches.length > 0 ? inf.niches : inf.genre ? [inf.genre] : [];

  return (
    <div
      onClick={onToggleSelect}
      className={`creator-card p-3 cursor-pointer transition-all flex flex-col gap-2.5 ${
        selected ? "ring-2 ring-gold ring-offset-1 ring-offset-obsidian" : ""
      }`}
    >
      {/* Header: avatar | name+tier+social | rating+status */}
      <div className="flex items-start gap-2.5">

        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={inf.photo}
            alt={inf.name}
            loading="lazy"
            className="w-12 h-12 rounded-xl object-cover bg-charcoal"
          />
          {selected && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
              <CheckSquare className="w-3 h-3 text-obsidian" />
            </div>
          )}
        </div>

        {/* Name + tier + social icons */}
        <div className="min-w-0 flex-1">
          {/* Name row with tier badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={`/influencer/${inf.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-chalk text-sm hover:text-gold transition-colors truncate leading-tight"
            >
              {inf.name}
            </Link>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${TIER_CLASS[inf.tier] || ""}`}>
              {(TIER_LABEL[inf.tier] ?? inf.tier).toUpperCase()}
            </span>
          </div>

          {/* Social icon links */}
          <div className="flex items-center gap-2 mt-1">
            {inf.igHandle ? (
              <a
                href={`https://instagram.com/${inf.igHandle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={`@${inf.igHandle}`}
                className="text-chalk-faint hover:text-[#E1306C] transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            ) : null}
            {inf.ytHandle ? (
              <a
                href={`https://youtube.com/@${inf.ytHandle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={`@${inf.ytHandle}`}
                className="text-chalk-faint hover:text-[#FF0000] transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            ) : null}
            {!inf.igHandle && !inf.ytHandle && (
              <span className="text-[10px] text-chalk-faint/50">No socials linked</span>
            )}
          </div>
        </div>

        {/* Right column: rating (top) + online/offline (below) */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {inf.avgRating != null && inf.avgRating > 0 ? (
            <span className="inline-flex items-center gap-0.5 bg-gold/15 border border-gold/30 px-1.5 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-gold stroke-none" />
              <span className="text-xs font-bold text-gold leading-none">{Number(inf.avgRating).toFixed(1)}</span>
            </span>
          ) : (
            <span className="h-5" />
          )}
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${inf.isOnline ? "text-green-400" : "text-chalk-faint"}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inf.isOnline ? "bg-green-400 shadow-[0_0_4px_#4ade80]" : "bg-white/20"}`} />
            {inf.isOnline ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {genres.slice(0, 3).map((n) => (
            <span key={n} className="text-xs text-chalk-faint border border-white/10 px-1.5 py-0.5 rounded-full">
              {n}
            </span>
          ))}
          {genres.length > 3 && (
            <span className="text-xs text-chalk-faint border border-white/10 px-1.5 py-0.5 rounded-full">
              +{genres.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Location */}
      {(inf.city || inf.state) && (
        <div className="flex items-center gap-1 text-[11px] text-chalk-faint">
          <MapPin className="w-3 h-3 shrink-0 text-chalk-dim" />
          <span className="truncate">{[inf.city, inf.state].filter(Boolean).join(", ")}</span>
        </div>
      )}

      {/* Stats: 3 cells */}
      <div className="grid grid-cols-3 gap-1">
        {[
          { label: "Followers", value: inf.followers ? fmt(inf.followers) : "—" },
          { label: "ER%",       value: inf.engagementRate != null ? `${inf.engagementRate}%` : "—" },
          { label: "Cost",      value: inf.price ? fmtPrice(inf.price) : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bento-card-dark rounded-lg p-2 text-center">
            <p className="text-[10px] text-chalk-faint leading-none mb-1">{label}</p>
            <p className="text-xs font-bold text-chalk leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      {inf.tier === "celeb" ? (
        <button
          onClick={(e) => { e.stopPropagation(); onGetInTouch(); }}
          className="w-full py-2 text-sm rounded-lg font-semibold border border-gold/40 text-gold hover:bg-gold/10 transition-all"
        >
          Get In Touch
        </button>
      ) : (
        <button
          onClick={handleCartClick}
          className={`w-full py-2 text-sm rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            inCart
              ? "bg-green-500/15 text-green-400 border border-green-500/30"
              : "purple-pill"
          }`}
        >
          {inCart ? <><Check className="w-4 h-4" /> Selected</> : <>Select</>}
        </button>
      )}
    </div>
  );
}
