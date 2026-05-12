import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Instagram, Youtube, SlidersHorizontal, CheckSquare, Megaphone } from "lucide-react";
import { api, InfluencerProfile } from "@/lib/api";
import { Influencer } from "@/lib/store";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { RisingStarsCarousel } from "@/components/RisingStarsCarousel";
import { CelebCallbackModal } from "@/components/CelebCallbackModal";
import { CreatorCard } from "@/components/CreatorCard";
import { CreatorCardSkeleton } from "@/components/CreatorCardSkeleton";
import { Search } from "lucide-react";

interface MarketplaceProps {
  isInCart: (id: string) => boolean;
  addToCart: (i: Influencer) => void;
}

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];
const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", macro: "tier-macro", celeb: "tier-celebrity",
};
const TIER_LABEL: Record<string, string> = {
  all: "All", nano: "Nano", micro: "Micro", macro: "Macro", celeb: "Celebrity",
};
const PER_PAGE = 12;

// Placeholder banner data — replace with real ad API
const BANNERS = [
  { id: 1, label: "Advertise your brand here", cta: "Learn More", gradient: "from-purple-600/30 to-pink-600/30" },
];

const parseUrlTier = (raw: string | null): Tier | "all" => {
  if (!raw) return "all";
  const lower = raw.toLowerCase();
  if (lower === "mega") return "celeb"; // backwards-compat alias
  if ((TIERS as readonly string[]).includes(lower)) return lower as Tier;
  return "all";
};

export default function Marketplace({ isInCart, addToCart }: MarketplaceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tier: Tier | "all" = parseUrlTier(searchParams.get("tier"));
  const [platform, setPlatform] = useState<"all" | "instagram" | "youtube">("all");
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [celebModal, setCelebModal] = useState<{ id: string; name: string } | null>(null);

  const genreKey = selectedGenres.join(',');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search: wait 350ms after user stops typing before updating debouncedSearch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const toInfluencer = (inf: InfluencerProfile): Influencer => ({
    id: inf.id ?? inf._id ?? "",
    name: inf.name || "",
    handle: inf.socialHandles?.instagram || inf.socialHandles?.youtube || "",
    photo: inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.name}`,
    platform: (inf.platform as "instagram" | "youtube") || "instagram",
    tier: (inf.tier as Tier) || "nano",
    genre: inf.niches?.[0] || "",
    city: inf.city || "",
    followers: inf.followerCount || 0, activeFollowers: 0, fakeFollowers: 0,
    avgViews: 0, avgLikes: 0,
    genderSplit: { male: 45, female: 52, other: 3 },
    price: inf.pricing ? (Math.min(...Object.values(inf.pricing).filter(v => v > 0)) || null) : null,
    isOnline: inf.isOnline, lastSeenAt: inf.lastSeenAt,
    avgRating: inf.avgRating ?? null, ratingCount: inf.ratingCount ?? 0,
  });

  const { data: influencers = [], isLoading: loading } = useQuery({
    queryKey: ['marketplace', gender, tier, platform, location, genreKey, debouncedSearch],
    queryFn: async () => {
      const data = await api.searchInfluencers({
        gender: gender !== "all" ? gender : undefined,
        tier: tier !== "all" ? tier : undefined,
        platform: platform !== "all" ? platform : undefined,
        city: location || undefined,
        genre: selectedGenres.length === 1 ? selectedGenres[0] : undefined,
        name: debouncedSearch || undefined,
      });
      return (Array.isArray(data) ? data : []).map(toInfluencer);
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const filtered = useMemo(() => {
    let r = influencers;
    // If server already filtered by debouncedSearch, skip re-filtering; only apply if search differs
    if (search.trim() && search.trim() !== debouncedSearch) {
      const q = search.trim().toLowerCase();
      r = r.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.handle?.toLowerCase().includes(q) ||
        i.genre?.toLowerCase().includes(q)
      );
    }
    if (platform !== "all") {
      r = r.filter((i) => {
        const p: string[] = Array.isArray(i.platform) ? (i.platform as unknown as string[]) : [i.platform as string].filter(Boolean);
        return p.length === 0 || p.includes(platform);
      });
    }
    if (selectedGenres.length) r = r.filter((i) => selectedGenres.includes(i.genre));
    if (location) r = r.filter((i) => i.city?.toLowerCase().includes(location.toLowerCase()));
    if (priceMin) r = r.filter((i) => i.price != null && i.price >= parseInt(priceMin));
    if (priceMax) r = r.filter((i) => i.price != null && i.price <= parseInt(priceMax));
    return r;
  }, [influencers, search, debouncedSearch, platform, selectedGenres, location, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleGenre = (g: string) => setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const s = new Set(prev); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });
  const selectAll = () => setSelectedIds(new Set(paged.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());
  const addSelectedToCart = () => { paged.filter((i) => selectedIds.has(i.id) && !isInCart(i.id)).forEach(addToCart); clearSelection(); };

  const handleSelectCount = (val: string) => {
    if (val === "all") {
      selectAll();
    } else {
      const n = parseInt(val);
      if (!isNaN(n)) {
        setSelectedIds(new Set(paged.slice(0, n).map((i) => i.id)));
      }
    }
  };

  const activeFilterCount = selectedGenres.length + (gender !== "all" ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (location ? 1 : 0);
  const clearFilters = () => { setSelectedGenres([]); setGender("all"); setPriceMin(""); setPriceMax(""); setLocation(""); setPage(1); };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Header */}
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

      {/* Sticky search + controls bar */}
      <div className="sticky top-16 z-30 bg-obsidian border-b border-white/5 px-4 py-2 space-y-2">
        {/* Search bar + platform toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-faint pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search creators..."
              className="w-full bg-charcoal/50 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-chalk placeholder:text-chalk-faint focus:outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex rounded-full border border-white/10 overflow-hidden shrink-0">
            {(["instagram", "youtube"] as const).map((p) => (
              <button key={p}
                onClick={() => { setPlatform(platform === p ? "all" : p); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 transition-all text-xs ${platform === p ? "bg-white/10 text-chalk" : "text-chalk-dim hover:text-chalk"}`}>
                {p === "instagram" ? <Instagram className="w-3.5 h-3.5" /> : <Youtube className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{p === "instagram" ? "Instagram" : "YouTube"}</span>
              </button>
            ))}
          </div>
        </div>

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
              <button key={t} onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (t === "all") next.delete("tier"); else next.set("tier", t);
                setSearchParams(next, { replace: true });
                setPage(1);
              }}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${tier === t ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim hover:text-chalk"}`}>
                {TIER_LABEL[t] ?? t}
              </button>
            ))}
          </div>

          {/* Select No. / All */}
          <div className="flex items-center gap-1">
            <select
              value=""
              onChange={(e) => handleSelectCount(e.target.value)}
              className="bg-charcoal/50 border border-white/10 rounded-full px-2 py-1.5 text-xs text-chalk-dim focus:outline-none focus:border-gold/50"
            >
              <option value="" disabled>Select No.</option>
              {[5, 10, 20].map((n) => (
                <option key={n} value={n} disabled={paged.length < n}>{n}</option>
              ))}
              <option value="all">All ({paged.length})</option>
            </select>
            {selectedIds.size > 0 && (
              <button onClick={clearSelection}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs border border-white/10 text-chalk-dim hover:text-chalk transition-all">
                <CheckSquare className="w-3 h-3 text-gold" /> {selectedIds.size} selected
              </button>
            )}
          </div>

          {/* Add selected to cart */}
          {selectedIds.size > 0 && (
            <button onClick={addSelectedToCart} className="purple-pill px-4 py-1.5 text-xs font-bold">
              Add {selectedIds.size} to Cart
            </button>
          )}

          {/* Creator count */}
          <span className="text-xs text-chalk-dim">{filtered.length} creators</span>

        </div>
      </div>

      {/* Main */}
      <main className="flex-1 p-4 space-y-4">
        {/* Rising Stars */}
        <RisingStarsCarousel />

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-chalk-dim">
            <p>No creators found matching your filters.</p>
            {influencers.length === 0 && (
              <Link to="/influencer-register" className="purple-pill px-5 py-2 text-sm">Be the first creator →</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {paged.map((inf) => (
              <CreatorCard
                key={inf.id}
                inf={inf}
                selected={selectedIds.has(inf.id)}
                inCart={isInCart(inf.id)}
                onToggleSelect={() => toggleSelect(inf.id)}
                onAddToCart={() => { if (!isInCart(inf.id)) addToCart(inf); }}
                onGetInTouch={() => setCelebModal({ id: inf.id, name: inf.name })}
              />
            ))}
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

      {celebModal && (
        <CelebCallbackModal
          influencerId={celebModal.id}
          influencerName={celebModal.name}
          onClose={() => setCelebModal(null)}
        />
      )}
    </div>
  );
}
