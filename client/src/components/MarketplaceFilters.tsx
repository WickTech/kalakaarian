import { X } from "lucide-react";

const GENRES = ["Fashion", "Tech", "Food", "Fitness", "Travel", "Beauty", "Gaming", "Education", "Comedy", "Lifestyle"];
const GENDERS = ["all", "male", "female"] as const;
type GenderFilter = (typeof GENDERS)[number];

interface Props {
  open: boolean;
  onClose: () => void;
  selectedGenres: string[];
  toggleGenre: (g: string) => void;
  gender: GenderFilter;
  setGender: (g: GenderFilter) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  onClear: () => void;
  activeCount: number;
}

export function MarketplaceFilters({
  open, onClose, selectedGenres, toggleGenre, gender, setGender,
  priceMin, setPriceMin, priceMax, setPriceMax, location, setLocation,
  onClear, activeCount,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-obsidian border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <span className="font-display font-bold text-chalk text-sm">
            Filters {activeCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-xs">{activeCount}</span>
            )}
          </span>
          <button onClick={onClose} className="p-1 text-chalk-dim hover:text-chalk transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-xs text-chalk uppercase tracking-widest mb-3">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`goal-chip px-3 py-1 text-xs ${selectedGenres.includes(g) ? "selected" : ""}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-chalk uppercase tracking-widest mb-3">Gender</p>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    gender === g ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim"
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-chalk-faint uppercase tracking-widest mb-3">Price Range (₹)</p>
            <div className="flex gap-2">
              <input
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="dark-input w-full px-3 py-2 text-xs"
                placeholder="Min ₹"
              />
              <input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="dark-input w-full px-3 py-2 text-xs"
                placeholder="Max ₹"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-chalk-faint uppercase tracking-widest mb-3">Location</p>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="dark-input w-full px-3 py-2 text-xs"
              placeholder="Mumbai, Delhi…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClear}
            className="w-full py-2 rounded-full text-xs text-chalk-dim border border-white/10 hover:text-chalk hover:border-white/20 transition-all"
          >
            Clear all filters
          </button>
        </div>
      </div>
    </>
  );
}
