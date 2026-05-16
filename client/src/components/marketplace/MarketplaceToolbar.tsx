import { ArrowUpDown, Instagram, Youtube, Search, SlidersHorizontal, ShoppingCart, X, Users } from "lucide-react";

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];
const TIER_LABEL: Record<string, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celeb",
};

export type SortBy = "relevance" | "followers_desc" | "er_desc" | "price_asc" | "price_desc" | "rating_desc";
const SORT_OPTIONS: { value: SortBy; label: string; short: string }[] = [
  { value: "relevance",      label: "Relevance",        short: "Relevant" },
  { value: "followers_desc", label: "Most Followers",   short: "Followers" },
  { value: "er_desc",        label: "Top ER%",          short: "ER%" },
  { value: "price_asc",      label: "Price: Low → High",short: "Price ↑" },
  { value: "price_desc",     label: "Price: High → Low",short: "Price ↓" },
  { value: "rating_desc",    label: "Top Rated",        short: "Rating" },
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

const selCls = "bg-charcoal border border-white/15 rounded-lg px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-gold/50 transition-colors cursor-pointer shrink-0";

export function MarketplaceToolbar(p: Props) {
  return (
    <div className="sticky top-14 z-30 bg-obsidian border-b border-white/5 px-3 sm:px-4 py-2.5 space-y-2">

      {/* Row 1 — platform toggle */}
      <div className="flex w-full rounded-xl border border-white/10 overflow-hidden h-9">
        <button
          onClick={() => p.setPlatform(p.platform === "instagram" ? "all" : "instagram")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${
            p.platform === "instagram"
              ? "bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-orange-400/40 text-chalk"
              : "text-chalk-dim hover:text-chalk hover:bg-white/5"
          }`}
        >
          <Instagram className={`w-3.5 h-3.5 ${p.platform === "instagram" ? "text-pink-400" : ""}`} />
          <span className="hidden xs:inline sm:inline">Instagram</span>
        </button>
        <div className="w-px bg-white/10" />
        <button
          onClick={() => p.setPlatform(p.platform === "youtube" ? "all" : "youtube")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${
            p.platform === "youtube"
              ? "bg-red-600/25 text-red-300"
              : "text-chalk-dim hover:text-chalk hover:bg-white/5"
          }`}
        >
          <Youtube className={`w-3.5 h-3.5 ${p.platform === "youtube" ? "text-red-400" : ""}`} />
          <span className="hidden xs:inline sm:inline">YouTube</span>
        </button>
      </div>

      {/* Row 2 — search + filters + tier chips (scrolls horizontally, no wrap) */}
      <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-chalk-faint pointer-events-none" />
          <input
            type="text"
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-charcoal/60 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm text-chalk placeholder:text-chalk-faint focus:outline-none focus:border-gold/50 transition-colors w-32 sm:w-44"
          />
        </div>

        <button
          onClick={p.openDrawer}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 whitespace-nowrap ${
            p.activeFilterCount > 0
              ? "border-gold text-gold bg-gold/10"
              : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filters
          {p.activeFilterCount > 0 && (
            <span className="bg-gold text-obsidian px-1.5 rounded-full text-[10px] font-bold leading-none py-0.5">{p.activeFilterCount}</span>
          )}
        </button>

        <div className="w-px h-4 bg-white/15 shrink-0" />

        {(["all", ...TIERS] as const).map((t) => (
          <button key={t} onClick={() => p.setTier(t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all shrink-0 ${
              p.tier === t ? "border-gold text-gold bg-gold/10" : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
            }`}>
            {TIER_LABEL[t] ?? t}
          </button>
        ))}
      </div>

      {/* Row 3 — sort + bulk select + count, ALL ON ONE LINE */}
      <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

        {/* Sort by */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ArrowUpDown className="w-3 h-3 text-chalk-faint shrink-0" />
          <span className="text-xs text-chalk-dim font-medium whitespace-nowrap hidden sm:inline">Sort</span>
          <select value={p.sortBy} onChange={(e) => p.setSortBy(e.target.value as SortBy)} className={selCls}>
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-4 bg-white/15 shrink-0" />

        {/* Bulk select */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Users className="w-3 h-3 text-chalk-faint shrink-0" />
          <span className="text-xs text-chalk-dim font-medium whitespace-nowrap hidden sm:inline">Bulk</span>
          <select value="" onChange={(e) => { if (e.target.value) p.onSelectCount(e.target.value); }} className={selCls}>
            <option value="" disabled>Pick…</option>
            {[5, 10, 20].map((n) => (
              <option key={n} value={n} disabled={p.pagedCount < n}>Top {n}</option>
            ))}
            <option value="all">All ({p.pagedCount})</option>
          </select>
        </div>

        {/* Selected actions — inline, same row */}
        {p.selectedCount > 0 && (
          <>
            <div className="w-px h-4 bg-white/15 shrink-0" />
            <span className="text-xs text-gold font-semibold whitespace-nowrap shrink-0">{p.selectedCount} selected</span>
            <button onClick={p.onClearSelection} className="p-0.5 text-chalk-faint hover:text-chalk transition-colors shrink-0" title="Clear selection">
              <X className="w-3 h-3" />
            </button>
            <button onClick={p.onAddSelectedToCart} className="purple-pill px-2.5 py-1 text-xs font-bold flex items-center gap-1 shrink-0">
              <ShoppingCart className="w-3 h-3" />
              <span>Add {p.selectedCount}</span>
            </button>
          </>
        )}

        {/* Creator count — pushed to end */}
        <span className="text-xs text-chalk-faint whitespace-nowrap shrink-0 ml-auto pl-1">{p.filteredCount} creators</span>
      </div>
    </div>
  );
}
