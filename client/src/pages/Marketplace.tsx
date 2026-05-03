import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Instagram, Youtube, ArrowLeft, SlidersHorizontal, CheckSquare, Square, Megaphone } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";
import { Influencer } from "@/lib/store";
import { NotificationBell } from "@/components/NotificationBell";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";

interface MarketplaceProps {
  dark: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartOpen: () => void;
  isInCart: (id: string) => boolean;
  addToCart: (i: Influencer) => void;
}

const TIERS = ["nano", "micro", "macro", "mega"] as const;
type Tier = (typeof TIERS)[number];
const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", macro: "tier-macro", mega: "tier-celebrity",
};
const PER_PAGE = 12;

// Placeholder banner data — replace with real ad API
const BANNERS = [
  { id: 1, label: "Advertise your brand here", cta: "Learn More", gradient: "from-purple-600/30 to-pink-600/30" },
];

export default function Marketplace({ cartCount, onCartOpen, isInCart, addToCart }: MarketplaceProps) {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"all" | "instagram" | "youtube">("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.searchInfluencers({
          gender: gender !== "all" ? gender : undefined,
          tier: tier !== "all" ? tier : undefined,
          platform: platform !== "all" ? platform : undefined,
          city: location || undefined,
          genre: selectedGenres.length === 1 ? selectedGenres[0] : undefined,
        });
        const transformed: Influencer[] = (Array.isArray(data) ? data : []).map((inf: InfluencerProfile) => ({
          id: inf._id || inf.id || "",
          name: inf.name || "",
          handle: inf.socialHandles?.instagram || inf.socialHandles?.youtube || "",
          photo: inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`,
          platform: (inf.platform as "instagram" | "youtube") || "instagram",
          tier: (inf.tier as Tier) || "micro",
          genre: inf.niches?.[0] || "",
          city: inf.city || "",
          followers: inf.followerCount || 0, activeFollowers: 0, fakeFollowers: 0,
          avgViews: 0, avgLikes: 0,
          genderSplit: { male: 45, female: 52, other: 3 },
          price: null, isOnline: inf.isOnline, lastSeenAt: inf.lastSeenAt,
        }));
        setInfluencers(transformed);
      } catch { setInfluencers([]); }
      finally { setLoading(false); }
    };
    load();
  }, [gender, tier, platform, location, selectedGenres]);

  const filtered = useMemo(() => {
    let r = influencers;
    if (platform !== "all") {
      r = r.filter((i) => {
        const p: string[] = Array.isArray(i.platform) ? (i.platform as unknown as string[]) : [i.platform as string].filter(Boolean);
        return p.length === 0 || p.includes(platform);
      });
    }
    if (tier !== "all") r = r.filter((i) => i.tier === tier);
    if (selectedGenres.length) r = r.filter((i) => selectedGenres.includes(i.genre));
    if (location) r = r.filter((i) => i.city?.toLowerCase().includes(location.toLowerCase()));
    if (priceMin) r = r.filter((i) => i.price != null && i.price >= parseInt(priceMin));
    if (priceMax) r = r.filter((i) => i.price != null && i.price <= parseInt(priceMax));
    return r;
  }, [influencers, platform, tier, selectedGenres, location, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleGenre = (g: string) => setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAll = () => setSelectedIds(new Set(paged.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());
  const addSelectedToCart = () => { paged.filter((i) => selectedIds.has(i.id) && !isInCart(i.id)).forEach(addToCart); clearSelection(); };

  const activeFilterCount = selectedGenres.length + (gender !== "all" ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (location ? 1 : 0);
  const clearFilters = () => { setSelectedGenres([]); setGender("all"); setPriceMin(""); setPriceMax(""); setLocation(""); setPage(1); };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-obsidian/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-chalk">Creators</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={onCartOpen} className="relative p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-obsidian text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Banner / Ads slot */}
      <div className="px-4 pt-4">
        {BANNERS.map((b) => (
          <div key={b.id} className={`w-full rounded-xl bg-gradient-to-r ${b.gradient} border border-white/10 px-5 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Megaphone className="w-4 h-4 text-purple-300 shrink-0" />
              <span className="text-sm text-chalk/80">{b.label}</span>
            </div>
            <button className="text-xs px-3 py-1 rounded-full border border-purple-400/40 text-purple-300 hover:bg-purple-500/20 transition-all shrink-0">
              {b.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Filter drawer */}
      <MarketplaceFilters
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedGenres={selectedGenres}
        toggleGenre={toggleGenre}
        gender={gender}
        setGender={setGender}
        priceMin={priceMin}
        setPriceMin={(v) => { setPriceMin(v); setPage(1); }}
        priceMax={priceMax}
        setPriceMax={(v) => { setPriceMax(v); setPage(1); }}
        location={location}
        setLocation={(v) => { setLocation(v); setPage(1); }}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      />

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Controls bar */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filters button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
              activeFilterCount > 0
                ? "border-gold text-gold bg-gold/10"
                : "border-white/10 text-chalk-dim hover:text-chalk"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {/* Tier pills */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...TIERS] as const).map((t) => (
              <button key={t} onClick={() => { setTier(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${tier === t ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim hover:text-chalk"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Select All */}
          <button
            onClick={selectedIds.size === paged.length && paged.length > 0 ? clearSelection : selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/10 text-chalk-dim hover:text-chalk transition-all"
          >
            {selectedIds.size === paged.length && paged.length > 0
              ? <><CheckSquare className="w-3 h-3 text-gold" /> Deselect All</>
              : <><Square className="w-3 h-3" /> Select All</>
            }
          </button>

          {/* Add selected to cart */}
          {selectedIds.size > 0 && (
            <button onClick={addSelectedToCart} className="purple-pill px-4 py-1.5 text-xs font-bold">
              Add {selectedIds.size} to Cart
            </button>
          )}

          {/* Creator count */}
          <span className="text-xs text-chalk-dim">{filtered.length} creators</span>

          {/* Platform toggle — right side */}
          <div className="ml-auto flex rounded-full border border-white/10 overflow-hidden text-sm shrink-0">
            <button onClick={() => { setPlatform("all"); setPage(1); }}
              className={`px-4 py-2 transition-all text-xs ${platform === "all" ? "bg-white/10 text-chalk" : "text-chalk-dim"}`}>All</button>
            {(["instagram", "youtube"] as const).map((p) => (
              <button key={p} onClick={() => { setPlatform(p); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 transition-all text-xs ${platform === p ? "bg-white/10 text-chalk" : "text-chalk-dim"}`}>
                {p === "instagram" ? <Instagram className="w-3.5 h-3.5" /> : <Youtube className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-chalk-dim">
            <p>No creators found matching your filters.</p>
            {influencers.length === 0 && (
              <Link to="/influencer-register" className="purple-pill px-5 py-2 text-sm">Be the first creator →</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paged.map((inf) => {
              const inCart = isInCart(inf.id);
              const selected = selectedIds.has(inf.id);
              return (
                <div
                  key={inf.id}
                  onClick={() => toggleSelect(inf.id)}
                  className={`creator-card p-4 cursor-pointer transition-all ${selected ? "ring-2 ring-gold ring-offset-1 ring-offset-obsidian" : ""}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <img src={inf.photo} alt={inf.name} className="w-12 h-12 rounded-full object-cover bg-charcoal" />
                      {selected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-obsidian" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/influencer/${inf.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-chalk text-sm hover:text-gold transition-colors truncate block"
                      >{inf.name}</Link>
                      <p className="text-xs text-chalk-dim truncate">{inf.handle ? `@${inf.handle.replace("@", "")}` : "—"}</p>
                      {inf.city && <p className="text-xs text-chalk-faint">{inf.city}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CLASS[inf.tier] || ""}`}>{inf.tier.toUpperCase()}</span>
                    {inf.genre && <span className="text-[10px] text-chalk-faint border border-white/10 px-2 py-0.5 rounded-full">{inf.genre}</span>}
                    {inf.isOnline && <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" title="Online" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bento-card-dark p-2 rounded-lg">
                      <p className="text-xs text-chalk-faint">Followers</p>
                      <p className="text-sm font-bold text-chalk">{inf.followers ? `${(inf.followers / 1000).toFixed(0)}K` : "—"}</p>
                    </div>
                    <div className="bento-card-dark p-2 rounded-lg">
                      <p className="text-xs text-chalk-faint">ER%</p>
                      <p className="text-sm font-bold text-chalk">—</p>
                    </div>
                    <div className="bento-card-dark p-2 rounded-lg">
                      <p className="text-xs text-chalk-faint">Reel ₹</p>
                      <p className="text-sm font-bold text-chalk">{inf.price ? `₹${inf.price.toLocaleString("en-IN")}` : "—"}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); !inCart && addToCart(inf); }}
                    className={`w-full py-2 text-xs rounded-full font-bold transition-all ${inCart ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default" : "purple-pill"}`}
                  >
                    {inCart ? "✓ Added to Cart" : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-chalk-dim disabled:opacity-40 hover:text-chalk transition-colors">← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${p === page ? "bg-gold text-obsidian" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-chalk-dim disabled:opacity-40 hover:text-chalk transition-colors">Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}
