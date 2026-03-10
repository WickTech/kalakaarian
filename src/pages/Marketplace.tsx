import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { allInfluencers } from "@/lib/data";
import { Influencer } from "@/lib/store";
import { InfluencerCard } from "@/components/InfluencerCard";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MarketplaceProps {
  dark: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartOpen: () => void;
  isInCart: (id: string) => boolean;
  addToCart: (i: Influencer) => void;
}

const TIERS = ["nano", "micro", "macro", "celebrity"] as const;
const CITIES = ["All", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Ahmedabad", "Lucknow"];
const GENRES = ["All", "Fashion", "Tech", "Food", "Fitness", "Travel", "Beauty", "Gaming", "Education", "Comedy", "Lifestyle"];
const PER_PAGE = 12;

export default function Marketplace({ dark, toggleTheme, cartCount, onCartOpen, isInCart, addToCart }: MarketplaceProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTier = searchParams.get("tier") as typeof TIERS[number] | null;

  const [platform, setPlatform] = useState<"instagram" | "youtube">("instagram");
  const [tier, setTier] = useState<typeof TIERS[number] | "all">(initialTier || "all");
  const [city, setCity] = useState("All");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState<"high" | "low">("high");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = allInfluencers.filter((i) => i.platform === platform);
    if (tier !== "all") result = result.filter((i) => i.tier === tier);
    if (city !== "All") result = result.filter((i) => i.city === city);
    if (genre !== "All") result = result.filter((i) => i.genre === genre);
    result.sort((a, b) =>
      sort === "high" ? b.followers - a.followers : a.followers - b.followers
    );
    return result;
  }, [platform, tier, city, genre, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1 border border-border hover:border-terminal">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-mono text-sm uppercase tracking-[0.3em] font-bold">
            <span className="text-terminal">■</span> INFLUENCE.MARKET
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} toggle={toggleTheme} />
          <button onClick={onCartOpen} className="border border-border p-2 hover:border-terminal transition-colors relative">
            <span className="font-mono text-xs">CART</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-terminal text-primary-foreground font-mono text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Platform Switch */}
      <div className="border-b border-border grid grid-cols-2">
        <button
          onClick={() => { setPlatform("instagram"); setPage(1); }}
          className={`py-3 font-mono text-sm uppercase tracking-widest text-center border-r border-border transition-colors ${
            platform === "instagram" ? "bg-ig-pink/10 text-ig-pink border-b-2 border-b-ig-pink" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          INSTAGRAM
        </button>
        <button
          onClick={() => { setPlatform("youtube"); setPage(1); }}
          className={`py-3 font-mono text-sm uppercase tracking-widest text-center transition-colors ${
            platform === "youtube" ? "bg-yt-red/10 text-yt-red border-b-2 border-b-yt-red" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          YOUTUBE
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-border px-4 py-2 flex flex-wrap gap-2 items-center">
        <FilterSelect label="Tier" value={tier} options={["all", ...TIERS]} onChange={(v) => { setTier(v as any); setPage(1); }} />
        <FilterSelect label="City" value={city} options={CITIES} onChange={(v) => { setCity(v); setPage(1); }} />
        <FilterSelect label="Genre" value={genre} options={GENRES} onChange={(v) => { setGenre(v); setPage(1); }} />
        <FilterSelect
          label="Sort"
          value={sort}
          options={["high", "low"]}
          displayMap={{ high: "Highest First", low: "Lowest First" }}
          onChange={(v) => setSort(v as "high" | "low")}
        />
        <span className="ml-auto font-mono text-[10px] text-muted-foreground uppercase">
          {filtered.length} ASSETS FOUND
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4">
        {paginated.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="font-mono text-sm text-muted-foreground">NO ASSETS MATCH CURRENT FILTERS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((inf) => (
              <InfluencerCard
                key={inf.id}
                influencer={inf}
                isInCart={isInCart(inf.id)}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 font-mono text-xs border transition-colors ${
                p === page ? "border-terminal text-terminal bg-terminal/10" : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  displayMap,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  displayMap?: Record<string, string>;
}) {
  return (
    <div className="relative flex items-center gap-1">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-card border border-border px-3 py-1 pr-6 font-mono text-xs uppercase text-foreground cursor-pointer hover:border-terminal transition-colors focus:outline-none focus:border-terminal"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {displayMap?.[opt] ?? opt.toUpperCase()}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
      </div>
    </div>
  );
}
