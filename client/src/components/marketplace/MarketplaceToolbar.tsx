import { Instagram, Youtube, Search, SlidersHorizontal, CheckSquare } from "lucide-react";

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];
const TIER_LABEL: Record<string, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

interface Props {
  platform: "all" | "instagram" | "youtube";
  setPlatform: (p: "all" | "instagram" | "youtube") => void;
  search: string;
  setSearch: (v: string) => void;
  openDrawer: () => void;
  activeFilterCount: number;
  tier: Tier | "all";
  setTier: (t: Tier | "all") => void;
  selectedCount: number;
  pagedCount: number;
  filteredCount: number;
  onSelectCount: (val: string) => void;
  onClearSelection: () => void;
  onAddSelectedToCart: () => void;
}

export function MarketplaceToolbar(p: Props) {
  return (
    <div className="sticky top-16 z-30 bg-obsidian border-b border-white/5 px-4 py-2 space-y-2">
      <div className="flex w-full rounded-full border border-white/10 overflow-hidden">
        {(["instagram", "youtube"] as const).map((pl) => (
          <button key={pl}
            onClick={() => p.setPlatform(p.platform === pl ? "all" : pl)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-all text-xs ${p.platform === pl ? "bg-white/10 text-chalk" : "text-chalk-dim hover:text-chalk"}`}>
            {pl === "instagram" ? <Instagram className="w-3.5 h-3.5" /> : <Youtube className="w-3.5 h-3.5" />}
            <span>{pl === "instagram" ? "Instagram" : "YouTube"}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative shrink-0 w-36 sm:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-faint pointer-events-none" />
          <input
            type="text"
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-charcoal/50 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-chalk placeholder:text-chalk-faint focus:outline-none focus:border-gold/50"
          />
        </div>

        <button
          onClick={p.openDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all shrink-0 ${
            p.activeFilterCount > 0
              ? "border-gold text-gold bg-gold/10"
              : "border-white/10 text-chalk-dim hover:text-chalk"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filters {p.activeFilterCount > 0 && `(${p.activeFilterCount})`}
        </button>

        <div className="flex flex-wrap gap-1.5">
          {(["all", ...TIERS] as const).map((t) => (
            <button key={t} onClick={() => p.setTier(t)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${p.tier === t ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim hover:text-chalk"}`}>
              {TIER_LABEL[t] ?? t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <select
            value=""
            onChange={(e) => p.onSelectCount(e.target.value)}
            className="bg-charcoal/50 border border-white/10 rounded-full px-2 py-1.5 text-xs text-chalk-dim focus:outline-none focus:border-gold/50"
          >
            <option value="" disabled>Select No.</option>
            {[5, 10, 20].map((n) => (
              <option key={n} value={n} disabled={p.pagedCount < n}>{n}</option>
            ))}
            <option value="all">All ({p.pagedCount})</option>
          </select>
          {p.selectedCount > 0 && (
            <button onClick={p.onClearSelection}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs border border-white/10 text-chalk-dim hover:text-chalk transition-all">
              <CheckSquare className="w-3 h-3 text-gold" /> {p.selectedCount} selected
            </button>
          )}
        </div>

        {p.selectedCount > 0 && (
          <button onClick={p.onAddSelectedToCart} className="purple-pill px-4 py-1.5 text-xs font-bold">
            Add {p.selectedCount} to Cart
          </button>
        )}

        <span className="text-xs text-chalk-dim">{p.filteredCount} creators</span>
      </div>
    </div>
  );
}
