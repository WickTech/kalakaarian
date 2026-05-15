import { ArrowUpDown, Instagram, Youtube, Search, SlidersHorizontal, ShoppingCart, X } from "lucide-react";

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];
const TIER_LABEL: Record<string, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

export type SortBy = "relevance" | "followers_desc" | "er_desc" | "price_asc" | "price_desc" | "rating_desc";
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "followers_desc", label: "Most Followers" },
  { value: "er_desc", label: "Top ER%" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating_desc", label: "Top Rated" },
];

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
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
}

const selectCls = "bg-charcoal border border-white/15 rounded-lg px-3 py-1.5 text-sm text-chalk focus:outline-none focus:border-gold/50 transition-colors cursor-pointer";

export function MarketplaceToolbar(p: Props) {
  return (
    <div className="sticky top-14 z-30 bg-obsidian border-b border-white/5 px-4 py-3 space-y-3">
      {/* Platform toggle */}
      <div className="flex w-full rounded-xl border border-white/10 overflow-hidden">
        <button
          onClick={() => p.setPlatform(p.platform === "instagram" ? "all" : "instagram")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-all text-sm font-medium ${
            p.platform === "instagram"
              ? "bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-orange-400/40 text-chalk"
              : "text-chalk-dim hover:text-chalk hover:bg-white/5"
          }`}
        >
          <Instagram className={`w-4 h-4 ${p.platform === "instagram" ? "text-pink-400" : ""}`} />
          Instagram
        </button>
        <div className="w-px bg-white/10" />
        <button
          onClick={() => p.setPlatform(p.platform === "youtube" ? "all" : "youtube")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-all text-sm font-medium ${
            p.platform === "youtube"
              ? "bg-red-600/25 text-red-300"
              : "text-chalk-dim hover:text-chalk hover:bg-white/5"
          }`}
        >
          <Youtube className={`w-4 h-4 ${p.platform === "youtube" ? "text-red-400" : ""}`} />
          YouTube
        </button>
      </div>

      {/* Search + Filters + Tier chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative shrink-0 w-40 sm:w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-faint pointer-events-none" />
          <input
            type="text"
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            placeholder="Search creators…"
            className="w-full bg-charcoal/60 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-chalk placeholder:text-chalk-dim focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <button
          onClick={p.openDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all shrink-0 ${
            p.activeFilterCount > 0
              ? "border-gold text-gold bg-gold/10"
              : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters {p.activeFilterCount > 0 && <span className="bg-gold/20 text-gold px-1.5 rounded-full text-xs">{p.activeFilterCount}</span>}
        </button>

        <div className="flex flex-wrap gap-1.5">
          {(["all", ...TIERS] as const).map((t) => (
            <button key={t} onClick={() => p.setTier(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                p.tier === t ? "border-gold text-gold bg-gold/10" : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
              }`}>
              {TIER_LABEL[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + Bulk Select */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Sort By */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-chalk-faint shrink-0" />
          <span className="text-xs text-chalk-dim font-medium whitespace-nowrap">Sort by</span>
          <select value={p.sortBy} onChange={(e) => p.setSortBy(e.target.value as SortBy)} className={selectCls}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Bulk Select */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-chalk-dim font-medium whitespace-nowrap">Bulk select</span>
          <select value="" onChange={(e) => p.onSelectCount(e.target.value)} className={selectCls}>
            <option value="" disabled>Pick count…</option>
            {[5, 10, 20].map((n) => <option key={n} value={n} disabled={p.pagedCount < n}>Top {n}</option>)}
            <option value="all">All ({p.pagedCount})</option>
          </select>
        </div>

        {p.selectedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-chalk-dim">{p.selectedCount} selected</span>
            <button onClick={p.onClearSelection} className="p-1 text-chalk-faint hover:text-chalk transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            <button onClick={p.onAddSelectedToCart} className="purple-pill px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
              <ShoppingCart className="w-3 h-3" /> Add {p.selectedCount} to Cart
            </button>
          </div>
        )}

        <span className="text-xs text-chalk-dim ml-auto shrink-0">{p.filteredCount} creators</span>
      </div>
    </div>
  );
}
