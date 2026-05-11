import { Link } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { Influencer } from "@/lib/store";

const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", macro: "tier-macro", celeb: "tier-celebrity",
};
const TIER_LABEL: Record<string, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

interface Props {
  inf: Influencer;
  selected: boolean;
  inCart: boolean;
  onToggleSelect: () => void;
  onAddToCart: () => void;
  onGetInTouch: () => void;
}

export function CreatorCard({ inf, selected, inCart, onToggleSelect, onAddToCart, onGetInTouch }: Props) {
  return (
    <div
      onClick={onToggleSelect}
      className={`creator-card p-3 cursor-pointer transition-all ${selected ? "ring-2 ring-gold ring-offset-1 ring-offset-obsidian" : ""}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="relative shrink-0">
          <img src={inf.photo} alt={inf.name} loading="lazy" className="w-12 h-12 rounded-xl object-cover bg-charcoal" />
          {selected && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
              <CheckSquare className="w-3 h-3 text-obsidian" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Link to={`/influencer/${inf.id}`} onClick={(e) => e.stopPropagation()}
            className="font-medium text-chalk text-sm hover:text-gold transition-colors truncate block">
            {inf.name}
          </Link>
          <p className="text-xs text-chalk-dim truncate">{inf.handle ? `@${inf.handle.replace("@", "")}` : "—"}</p>
          {inf.city && <p className="text-xs text-chalk-faint">{inf.city}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CLASS[inf.tier] || ""}`}>
          {(TIER_LABEL[inf.tier] ?? inf.tier).toUpperCase()}
        </span>
        {inf.genre && <span className="text-[10px] text-chalk-faint border border-white/10 px-2 py-0.5 rounded-full">{inf.genre}</span>}
        {inf.isOnline && <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" title="Online" />}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bento-card-dark p-2 rounded-lg">
          <p className="text-xs text-chalk-faint">Followers</p>
          <p className="text-sm font-bold text-chalk">{inf.followers ? `${(inf.followers / 1000).toFixed(0)}K` : "—"}</p>
        </div>
        <div className="bento-card-dark p-2 rounded-lg">
          <p className="text-xs text-chalk-faint">Rating</p>
          {inf.avgRating ? (
            <div className="flex gap-px justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-xs ${s <= Math.round(inf.avgRating!) ? 'text-green-400' : 'text-white/20'}`}>★</span>
              ))}
            </div>
          ) : (
            <p className="text-sm font-bold text-chalk">—</p>
          )}
        </div>
        <div className="bento-card-dark p-2 rounded-lg">
          <p className="text-xs text-chalk-faint">Cost</p>
          <p className="text-sm font-bold text-chalk">{inf.price ? `₹${inf.price.toLocaleString("en-IN")}` : "—"}</p>
        </div>
      </div>
      {inf.tier === "celeb" ? (
        <button onClick={(e) => { e.stopPropagation(); onGetInTouch(); }}
          className="w-full py-1.5 text-[10px] rounded-full font-bold border border-gold/40 text-gold hover:bg-gold/10 transition-all">
          Get In Touch
        </button>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
          className={`w-full py-1.5 text-[10px] rounded-full font-bold transition-all ${inCart ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default" : "purple-pill"}`}>
          {inCart ? "✓ Added to Cart" : "Add to Cart"}
        </button>
      )}
    </div>
  );
}
