import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ShoppingCart, Instagram, Youtube } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";
import { InfluencerCard } from "@/components/InfluencerCard";
import { Influencer } from "@/lib/store";
import { NotificationBell } from "@/components/NotificationBell";

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
const CAMPAIGN_TYPES = ["All", "Reels", "Stories", "YT Video", "UGC Content"];
const GENDERS = ["All", "Male", "Female"];
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
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [followersMin, setFollowersMin] = useState<number | "">("");
  const [followersMax, setFollowersMax] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [gender, setGender] = useState<"All" | "Male" | "Female">("All");
  const [campaignType, setCampaignType] = useState<typeof CAMPAIGN_TYPES[number]>("All");

  useEffect(() => {
    const fetchInfluencers = async () => {
      setLoading(true);
      try {
        const data = await api.searchInfluencers();
        if (Array.isArray(data) && data.length > 0) {
          const transformed: Influencer[] = data.map((inf: InfluencerProfile) => ({
            id: inf._id || inf.id || "",
            name: inf.name || "",
            handle: inf.socialHandles?.instagram || inf.socialHandles?.youtube || "",
            photo: inf.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
            platform: (inf.platform as "instagram" | "youtube") || "instagram",
            tier: (inf.tier as "nano" | "micro" | "macro" | "celebrity") || "micro",
            genre: inf.niches?.[0] || "",
            city: inf.city || "",
            followers: 0,
            activeFollowers: 0,
            fakeFollowers: 0,
            avgViews: 0,
            avgLikes: 0,
            genderSplit: { male: 45, female: 52, other: 3 },
            price: null,
          }));
          setInfluencers(transformed);
        } else {
          setInfluencers([]);
        }
      } catch (err) {
        console.error("Failed to fetch influencers:", err);
        setInfluencers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInfluencers();
  }, []);

  const filtered = useMemo(() => {
    let result = influencers;
    if (platform === "instagram") {
      result = result.filter((i) => {
        if (Array.isArray(i.platform)) {
          return i.platform.includes("instagram");
        }
        return i.platform === "instagram";
      });
    } else {
      result = result.filter((i) => {
        if (Array.isArray(i.platform)) {
          return i.platform.includes("youtube");
        }
        return i.platform === "youtube";
      });
    }
    if (tier !== "all") result = result.filter((i) => i.tier === tier);
    if (city !== "All") result = result.filter((i) => i.city === city);
    if (genre !== "All") result = result.filter((i) => i.genre === genre);
    if (followersMin !== "") result = result.filter((i) => i.followers >= followersMin);
    if (followersMax !== "") result = result.filter((i) => i.followers <= followersMax);
    if (maxBudget !== "" && result[0]?.price !== null) {
      result = result.filter((i) => i.price !== null && i.price <= maxBudget);
    }
    if (gender !== "All") {
      const genderKey = gender.toLowerCase() as "male" | "female";
      result = result.filter((i) => i.genderSplit && i.genderSplit[genderKey] > 50);
    }
    result.sort((a, b) =>
      sort === "high" ? (b.followers - a.followers) : (a.followers - b.followers)
    );
    return result;
  }, [influencers, platform, tier, city, genre, sort, followersMin, followersMax, maxBudget, gender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 border border-border rounded-md hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold brand-text">Marketplace</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={onCartOpen} className="relative p-2 border border-border rounded-md hover:bg-secondary transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full brand-gradient text-primary-foreground text-xs flex items-center justify-center font-medium">
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
          className={`py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            platform === "instagram" 
              ? "bg-secondary text-primary border-b-2 border-b-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Instagram className="w-4 h-4" /> Instagram
        </button>
        <button
          onClick={() => { setPlatform("youtube"); setPage(1); }}
          className={`py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            platform === "youtube" 
              ? "bg-secondary text-destructive border-b-2 border-b-destructive" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Youtube className="w-4 h-4" /> YouTube
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-border px-4 py-3 space-y-2">
        <div className="flex flex-wrap gap-3 items-center">
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
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} influencers found
          </span>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-muted-foreground">Followers:</span>
          <input
            type="number"
            placeholder="Min"
            value={followersMin}
            onChange={(e) => { setFollowersMin(e.target.value ? parseInt(e.target.value) : ""); setPage(1); }}
            className="w-20 px-2 py-1 text-sm border border-border rounded-md bg-card focus:outline-none focus:border-primary"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="Max"
            value={followersMax}
            onChange={(e) => { setFollowersMax(e.target.value ? parseInt(e.target.value) : ""); setPage(1); }}
            className="w-20 px-2 py-1 text-sm border border-border rounded-md bg-card focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-muted-foreground ml-2">Budget (₹):</span>
          <input
            type="number"
            placeholder="Max"
            value={maxBudget}
            onChange={(e) => { setMaxBudget(e.target.value ? parseInt(e.target.value) : ""); setPage(1); }}
            className="w-24 px-2 py-1 text-sm border border-border rounded-md bg-card focus:outline-none focus:border-primary"
          />
          <FilterSelect label="Gender" value={gender} options={GENDERS} onChange={(v) => { setGender(v as any); setPage(1); }} />
          <FilterSelect label="Content" value={campaignType} options={CAMPAIGN_TYPES} onChange={(v) => { setCampaignType(v as any); setPage(1); }} />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <p className="text-muted-foreground">No influencers found matching your filters.</p>
            <button 
              onClick={() => { 
                setTier("all"); setCity("All"); setGenre("All"); 
                setFollowersMin(""); setFollowersMax(""); setMaxBudget("");
                setGender("All"); setCampaignType("All"); setPage(1);
              }}
              className="text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
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
        <div className="border-t border-border px-4 py-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-secondary transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-md text-sm transition-colors ${
                p === page 
                  ? "brand-gradient text-primary-foreground" 
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-secondary transition-colors"
          >
            Next
          </button>
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-card border border-border rounded-md px-3 py-1.5 pr-8 text-sm text-foreground cursor-pointer hover:border-primary transition-colors focus:outline-none focus:border-primary"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {displayMap?.[opt] ?? opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
      </div>
    </div>
  );
}
