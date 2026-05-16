import { X } from "lucide-react";

const GENRES = ["Fashion", "Tech", "Food", "Fitness", "Travel", "Beauty", "Gaming", "Education", "Comedy", "Lifestyle"];
const GENDERS = ["all", "male", "female"] as const;
type GenderFilter = (typeof GENDERS)[number];

const TIERS = ["all", "nano", "micro", "macro", "celeb"] as const;
type TierFilter = (typeof TIERS)[number];
const TIER_LABEL: Record<TierFilter, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};

interface Props {
  open: boolean;
  onClose: () => void;
  selectedGenres: string[];
  toggleGenre: (g: string) => void;
  gender: GenderFilter;
  setGender: (g: GenderFilter) => void;
  tier: TierFilter;
  setTier: (t: TierFilter) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  onClear: () => void;
  activeCount: number;
}

const inputCls = "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-chalk placeholder:text-chalk-dim focus:outline-none focus:border-gold/50 transition-colors";
const sectionLabel = "text-xs font-semibold text-chalk uppercase tracking-wider mb-3";

export function MarketplaceFilters({
  open, onClose, selectedGenres, toggleGenre, gender, setGender,
  tier, setTier,
  priceMin, setPriceMin, priceMax, setPriceMax, location, setLocation,
  onClear, activeCount,
}: Props) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />}

      <div className={`fixed top-0 left-0 z-50 h-full w-80 bg-obsidian border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-chalk text-base">Filters</span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-bold">{activeCount} active</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-chalk-dim hover:text-chalk transition-colors rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          {/* Tier */}
          <div>
            <p className={sectionLabel}>Creator Tier</p>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    tier === t
                      ? "border-gold text-gold bg-gold/10"
                      : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
                  }`}
                >
                  {TIER_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div>
            <p className={sectionLabel}>Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedGenres.includes(g)
                      ? "bg-gold/15 border-gold text-gold"
                      : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className={sectionLabel}>Creator Gender</p>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    gender === g
                      ? "border-gold text-gold bg-gold/10"
                      : "border-white/15 text-chalk-dim hover:text-chalk hover:border-white/30"
                  }`}
                >
                  {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className={sectionLabel}>Budget Range (₹)</p>
            <div className="flex gap-2.5">
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className={inputCls} placeholder="Min ₹" type="number" />
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className={inputCls} placeholder="Max ₹" type="number" />
            </div>
          </div>

          {/* Location */}
          <div>
            <p className={sectionLabel}>City / Location</p>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Mumbai, Delhi, Bengaluru…" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0 space-y-2">
          <button onClick={onClear} className="w-full py-2.5 rounded-lg text-sm text-chalk-dim border border-white/10 hover:text-chalk hover:border-white/25 transition-all">
            Clear all filters
          </button>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-semibold purple-pill">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
