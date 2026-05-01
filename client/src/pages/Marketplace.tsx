import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Instagram, Youtube, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";
import { Influencer } from "@/lib/store";
import { NotificationBell } from "@/components/NotificationBell";

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
const GENRES = ["Fashion", "Tech", "Food", "Fitness", "Travel", "Beauty", "Gaming", "Education", "Comedy", "Lifestyle"];
const GENDERS = ["all", "male", "female"] as const;
type GenderFilter = (typeof GENDERS)[number];
const PER_PAGE = 12;

export default function Marketplace({ cartCount, onCartOpen, isInCart, addToCart }: MarketplaceProps) {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"all" | "instagram" | "youtube">("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [followersMin, setFollowersMin] = useState("");
  const [followersMax, setFollowersMax] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await api.searchInfluencers({ gender: gender !== "all" ? gender : undefined });
        const transformed: Influencer[] = (Array.isArray(data) ? data : []).map((inf: InfluencerProfile) => ({
          id: inf._id || inf.id || "",
          name: inf.name || "",
          handle: inf.socialHandles?.instagram || inf.socialHandles?.youtube || "",
          photo: inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`,
          platform: (inf.platform as "instagram" | "youtube") || "instagram",
          tier: (inf.tier as Tier) || "micro",
          genre: inf.niches?.[0] || "",
          city: inf.city || "",
          followers: 0, activeFollowers: 0, fakeFollowers: 0,
          avgViews: 0, avgLikes: 0,
          genderSplit: { male: 45, female: 52, other: 3 },
          price: null, isOnline: inf.isOnline, lastSeenAt: inf.lastSeenAt,
        }));
        setInfluencers(transformed);
      } catch { setInfluencers([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [gender]);

  const filtered = useMemo(() => {
    let r = influencers;
    if (platform !== "all") {
      r = r.filter((i) => {
        // i.platform may be a string or an array (API returns string[])
        const p: string[] = Array.isArray(i.platform)
          ? (i.platform as unknown as string[])
          : [i.platform as string].filter(Boolean);
        // Influencers with no platform set are shown in all views
        return p.length === 0 || p.includes(platform);
      });
    }
    if (tier !== "all") r = r.filter((i) => i.tier === tier);
    if (selectedGenres.length) r = r.filter((i) => selectedGenres.includes(i.genre));
    if (location) r = r.filter((i) => i.city?.toLowerCase().includes(location.toLowerCase()));
    if (followersMin) r = r.filter((i) => i.followers >= parseInt(followersMin));
    if (followersMax) r = r.filter((i) => i.followers <= parseInt(followersMax));
    return r;
  }, [influencers, platform, tier, selectedGenres, location, followersMin, followersMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const SidebarContent = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-chalk-faint uppercase tracking-widest mb-3">Genre</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button key={g} onClick={() => toggleGenre(g)}
              className={`goal-chip px-3 py-1 text-xs ${selectedGenres.includes(g) ? "selected" : ""}`}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-chalk-faint uppercase tracking-widest mb-3">Gender</p>
        <div className="flex gap-2">
          {GENDERS.map((g) => (
            <button key={g} onClick={() => setGender(g)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${gender === g ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim"}`}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-chalk-faint uppercase tracking-widest mb-3">Follower Range</p>
        <div className="flex gap-2">
          <input value={followersMin} onChange={(e) => { setFollowersMin(e.target.value); setPage(1); }}
            className="dark-input w-full px-3 py-2 text-xs" placeholder="Min" />
          <input value={followersMax} onChange={(e) => { setFollowersMax(e.target.value); setPage(1); }}
            className="dark-input w-full px-3 py-2 text-xs" placeholder="Max" />
        </div>
      </div>
      <div>
        <p className="text-xs text-chalk-faint uppercase tracking-widest mb-3">Location</p>
        <input value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          className="dark-input w-full px-3 py-2 text-xs" placeholder="Mumbai, Delhi…" />
      </div>
      <button onClick={() => { setSelectedGenres([]); setGender("all"); setFollowersMin(""); setFollowersMax(""); setLocation(""); setPage(1); }}
        className="text-xs text-chalk-faint hover:text-chalk transition-colors underline underline-offset-2">
        Clear all filters
      </button>
    </div>
  );

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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg border border-white/10 text-chalk-dim">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <NotificationBell />
          <button onClick={onCartOpen} className="relative p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-obsidian text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-white/5 p-5 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-obsidian/90 backdrop-blur-md p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="font-display font-bold text-chalk">Filters</span>
              <button onClick={() => setSidebarOpen(false)} className="text-chalk-dim hover:text-chalk text-xl">✕</button>
            </div>
            <SidebarContent />
          </div>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Platform + Tier controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex rounded-full border border-white/10 overflow-hidden text-sm">
              <button onClick={() => { setPlatform("all"); setPage(1); }}
                className={`px-4 py-2 transition-all ${platform === "all" ? "bg-white/10 text-chalk" : "text-chalk-dim"}`}>
                All
              </button>
              {(["instagram", "youtube"] as const).map((p) => (
                <button key={p} onClick={() => { setPlatform(p); setPage(1); }}
                  className={`flex items-center gap-1.5 px-4 py-2 transition-all ${platform === p ? "bg-white/10 text-chalk" : "text-chalk-dim"}`}>
                  {p === "instagram" ? <Instagram className="w-3.5 h-3.5" /> : <Youtube className="w-3.5 h-3.5" />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", ...TIERS] as const).map((t) => (
                <button key={t} onClick={() => { setTier(t); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs border transition-all ${tier === t ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim hover:text-chalk"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-chalk-dim">{filtered.length} creators</span>
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
                return (
                  <div key={inf.id} className="creator-card p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <img src={inf.photo} alt={inf.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-charcoal" />
                      <div className="min-w-0">
                        <Link to={`/influencer/${inf.id}`} className="font-medium text-chalk text-sm hover:text-gold transition-colors truncate block">{inf.name}</Link>
                        <p className="text-xs text-chalk-dim truncate">{inf.handle ? `@${inf.handle.replace("@", "")}` : "—"}</p>
                        {inf.city && <p className="text-xs text-chalk-faint">{inf.city}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CLASS[inf.tier] || ""}`}>
                        {inf.tier.toUpperCase()}
                      </span>
                      {inf.genre && <span className="text-[10px] text-chalk-faint border border-white/10 px-2 py-0.5 rounded-full">{inf.genre}</span>}
                      {inf.isOnline && <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Online" />}
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
                    <button onClick={() => !inCart && addToCart(inf)}
                      className={`w-full py-2 text-xs rounded-full font-bold transition-all ${inCart ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default" : "purple-pill"}`}>
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
    </div>
  );
}
