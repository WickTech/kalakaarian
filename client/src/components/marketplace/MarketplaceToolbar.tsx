import { ArrowUpDown, Instagram, Youtube, Search, SlidersHorizontal, ShoppingCart, X, Users } from "lucide-react";

const TIERS = ["all", "nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];
const TIER_LABEL: Record<Tier, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celeb",
};

export type SortBy = "relevance" | "followers_desc" | "er_desc" | "price_asc" | "price_desc" | "rating_desc";
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "relevance",      label: "Relevance" },
  { value: "followers_desc", label: "Most Followers" },
  { value: "er_desc",        label: "Top ER%" },
  { value: "price_asc",      label: "Price ↑" },
  { value: "price_desc",     label: "Price ↓" },
  { value: "rating_desc",    label: "Top Rated" },
];

interface Props {
  platform: "all" | "instagram" | "youtube";
  setPlatform: (p: "all" | "instagram" | "youtube") => void;
  search: string;
  setSearch: (v: string) => void;
  openDrawer: () => void;
  activeFilterCount: number;
  tier: Tier;
  setTier: (t: Tier) => void;
  selectedCount: number;
  pagedCount: number;
  filteredCount: number;
  onSelectCount: (val: string) => void;
  onClearSelection: () => void;
  onAddSelectedToCart: () => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
}

const selCls = "bg-charcoal/80 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-gold/50 transition-colors cursor-pointer shrink-0";
const scroll = "flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]";
const divider = <div className="w-px h-4 bg-white/15 shrink-0" />;

export function MarketplaceToolbar(p: Props) {
  return (
    <div className="sticky top-14 z-30 bg-obsidian/95 backdrop-blur-md border-b border-white/8 px-3 sm:px-4 py-2.5 space-y-2.5">

      {/* Row 1 — search + filters + platform toggle */}
      <div className="flex items-center gap-2">
        {/* Search — grows to fill */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-faint pointer-events-none" />
          <input
            type="text"
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            placeholder="Search creators…"
            className="w-full bg-charcoal/60 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-chalk placeholder:text-chalk-faint focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Filters */}
        <button
          onClick={p.openDrawer}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
            p.activeFilterCount > 0
              ? "border-gold text-gold bg-gold/10"
              : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Filters</span>
          {p.activeFilterCount > 0 && (
            <span className="bg-gold text-obsidian w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center">{p.activeFilterCount}</span>
          )}
        </button>

        {/* Platform toggle — pill pair */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden shrink-0">
          <button
            onClick={() => p.setPlatform(p.platform === "instagram" ? "all" : "instagram")}
            className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium transition-all ${
              p.platform === "instagram"
                ? "bg-gradient-to-r from-purple-500/50 via-pink-500/40 to-orange-400/40 text-chalk"
                : "text-chalk-faint hover:text-chalk hover:bg-white/5"
            }`}
          >
            <Instagram className={`w-3.5 h-3.5 ${p.platform === "instagram" ? "text-pink-400" : ""}`} />
            <span className="hidden sm:inline">IG</span>
          </button>
          <div className="w-px bg-white/10" />
          <button
            onClick={() => p.setPlatform(p.platform === "youtube" ? "all" : "youtube")}
            className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium transition-all ${
              p.platform === "youtube"
                ? "bg-red-600/30 text-red-300"
                : "text-chalk-faint hover:text-chalk hover:bg-white/5"
            }`}
          >
            <Youtube className={`w-3.5 h-3.5 ${p.platform === "youtube" ? "text-red-400" : ""}`} />
            <span className="hidden sm:inline">YT</span>
          </button>
        </div>
      </div>

      {/* Row 2 — tier chips, always visible, scroll on tiny screens */}
      <div className={scroll}>
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => p.setTier(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all shrink-0 whitespace-nowrap ${
              p.tier === t
                ? "bg-gold/15 border-gold text-gold"
                : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/35 hover:bg-white/5"
            }`}
          >
            {TIER_LABEL[t]}
          </button>
        ))}

        <div className="ml-auto shrink-0 flex items-center gap-2">
          {divider}
          <span className="text-xs text-chalk-faint whitespace-nowrap">{p.filteredCount} creators</span>
        </div>
      </div>

      {/* Row 3 — sort + bulk + selected actions */}
      <div className={scroll}>
        <ArrowUpDown className="w-3 h-3 text-chalk-faint shrink-0" />
        <select value={p.sortBy} onChange={(e) => p.setSortBy(e.target.value as SortBy)} className={selCls}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {divider}

        <Users className="w-3 h-3 text-chalk-faint shrink-0" />
        <select value="" onChange={(e) => { if (e.target.value) p.onSelectCount(e.target.value); }} className={selCls}>
          <option value="" disabled>Bulk select…</option>
          {[5, 10, 20].map((n) => (
            <option key={n} value={n} disabled={p.pagedCount < n}>Top {n}</option>
          ))}
          <option value="all">All ({p.pagedCount})</option>
        </select>

        {p.selectedCount > 0 && (
          <>
            {divider}
            <span className="text-xs text-gold font-semibold whitespace-nowrap shrink-0">{p.selectedCount} selected</span>
            <button onClick={p.onClearSelection} className="p-0.5 text-chalk-faint hover:text-chalk transition-colors shrink-0">
              <X className="w-3 h-3" />
            </button>
            <button onClick={p.onAddSelectedToCart} className="purple-pill px-3 py-1 text-xs font-bold flex items-center gap-1.5 shrink-0">
              <ShoppingCart className="w-3 h-3" /> Add {p.selectedCount}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
