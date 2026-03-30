import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";
import { InfluencerCard } from "@/components/InfluencerCard";
import { Influencer } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MarketplaceProps {
  dark: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartOpen: () => void;
  isInCart: (id: string) => boolean;
  addToCart: (i: any) => void;
}

const TIERS = ["nano", "micro", "macro", "celebrity"] as const;
const CITIES = ["All", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Ahmedabad", "Lucknow"];
const GENRES = ["All", "Fashion", "Tech", "Food", "Fitness", "Travel", "Beauty", "Gaming", "Education", "Comedy", "Lifestyle"];
const PER_PAGE = 12;

const mockInfluencers: Influencer[] = [
  {
    id: "inf-1",
    name: "Aisha Kapoor",
    handle: "@aishastyled",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    platform: "instagram",
    tier: "micro",
    genre: "Fashion",
    city: "Mumbai",
    followers: 182000,
    activeFollowers: 156000,
    fakeFollowers: 26000,
    avgViews: 45000,
    avgLikes: 8900,
    genderSplit: { male: 35, female: 62, other: 3 },
    price: 25000,
  },
  {
    id: "inf-2",
    name: "Rohan Mehta",
    handle: "@rohanreviews",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    platform: "youtube",
    tier: "macro",
    genre: "Tech",
    city: "Delhi",
    followers: 265000,
    activeFollowers: 210000,
    fakeFollowers: 55000,
    avgViews: 120000,
    avgLikes: 15000,
    genderSplit: { male: 68, female: 30, other: 2 },
    price: 45000,
  },
  {
    id: "inf-3",
    name: "Maya Singh",
    handle: "@mapwithmaya",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    platform: "instagram",
    tier: "micro",
    genre: "Travel",
    city: "Bangalore",
    followers: 94000,
    activeFollowers: 78000,
    fakeFollowers: 16000,
    avgViews: 28000,
    avgLikes: 5200,
    genderSplit: { male: 42, female: 55, other: 3 },
    price: 18000,
  },
  {
    id: "inf-4",
    name: "Dev Arora",
    handle: "@devgetsfit",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    platform: "instagram",
    tier: "nano",
    genre: "Fitness",
    city: "Pune",
    followers: 51000,
    activeFollowers: 44000,
    fakeFollowers: 7000,
    avgViews: 15000,
    avgLikes: 3800,
    genderSplit: { male: 58, female: 40, other: 2 },
    price: 12000,
  },
  {
    id: "inf-5",
    name: "Kabir Jain",
    handle: "@kabirplays",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    platform: "youtube",
    tier: "macro",
    genre: "Gaming",
    city: "Hyderabad",
    followers: 402000,
    activeFollowers: 320000,
    fakeFollowers: 82000,
    avgViews: 250000,
    avgLikes: 35000,
    genderSplit: { male: 75, female: 23, other: 2 },
    price: 65000,
  },
  {
    id: "inf-6",
    name: "Sara Fernandes",
    handle: "@saramoneywise",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    platform: "youtube",
    tier: "micro",
    genre: "Finance",
    city: "Mumbai",
    followers: 118000,
    activeFollowers: 95000,
    fakeFollowers: 23000,
    avgViews: 55000,
    avgLikes: 7200,
    genderSplit: { male: 52, female: 45, other: 3 },
    price: 28000,
  },
];

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
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfluencers = async () => {
      setLoading(true);
      try {
        const data = await api.searchInfluencers();
        if (data.length > 0) {
          const transformed: Influencer[] = data.map((inf: InfluencerProfile) => ({
            id: inf._id || inf.id || "",
            name: inf.name || "",
            handle: inf.instagramHandle || inf.youtubeHandle || "",
            photo: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop`,
            platform: (inf.platform as "instagram" | "youtube") || "instagram",
            tier: (inf.tier as "nano" | "micro" | "macro" | "celebrity") || "micro",
            genre: inf.genres?.[0] || inf.niches?.[0] || "",
            city: inf.city || "",
            followers: inf.followers?.total || 0,
            activeFollowers: Math.floor((inf.followers?.total || 0) * 0.85),
            fakeFollowers: Math.floor((inf.followers?.total || 0) * 0.15),
            avgViews: Math.floor((inf.followers?.total || 0) * 0.3),
            avgLikes: Math.floor((inf.followers?.total || 0) * 0.05),
            genderSplit: { male: 45, female: 52, other: 3 },
            price: inf.price || null,
          }));
          setInfluencers(transformed);
        } else {
          setInfluencers(mockInfluencers);
        }
      } catch (err) {
        console.error("Failed to fetch influencers:", err);
        setInfluencers(mockInfluencers);
      } finally {
        setLoading(false);
      }
    };
    fetchInfluencers();
  }, []);

  const filtered = useMemo(() => {
    let result = influencers;
    if (platform === "instagram") {
      result = result.filter((i) => i.platform === "instagram");
    } else {
      result = result.filter((i) => i.platform === "youtube");
    }
    if (tier !== "all") result = result.filter((i) => i.tier === tier);
    if (city !== "All") result = result.filter((i) => i.city === city);
    if (genre !== "All") result = result.filter((i) => i.genre === genre);
    result.sort((a, b) =>
      sort === "high" ? (b.followers - a.followers) : (a.followers - b.followers)
    );
    return result;
  }, [influencers, platform, tier, city, genre, sort]);

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
