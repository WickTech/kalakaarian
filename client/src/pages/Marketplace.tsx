import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { api } from "@/lib/api";
import { Influencer } from "@/lib/store";
import { parseUrlTier, toInfluencer } from "@/lib/influencerMappers";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { MarketplaceToolbar } from "@/components/marketplace/MarketplaceToolbar";
import { MarketplacePagination } from "@/components/marketplace/MarketplacePagination";
import { RisingStarsCarousel } from "@/components/RisingStarsCarousel";
import { CelebCallbackModal } from "@/components/CelebCallbackModal";
import { CreatorCard } from "@/components/CreatorCard";
import { CreatorCardSkeleton } from "@/components/CreatorCardSkeleton";

interface MarketplaceProps {
  isInCart: (id: string) => boolean;
  addToCart: (i: Influencer) => void;
}

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];
const PER_PAGE = 12;

const BANNERS = [
  { id: 1, label: "Advertise your brand here", cta: "Learn More", gradient: "from-purple-600/30 to-pink-600/30" },
];

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

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
    if (search.trim() && search.trim() !== debouncedSearch) {
      const q = search.trim().toLowerCase();
      r = r.filter((i) => i.name.toLowerCase().includes(q) || i.handle?.toLowerCase().includes(q) || i.genre?.toLowerCase().includes(q));
    }
    if (platform !== "all") r = r.filter((i) => i.connectedPlatforms?.includes(platform));
    if (selectedGenres.length) r = r.filter((i) => selectedGenres.includes(i.genre));
    if (location) r = r.filter((i) => i.city?.toLowerCase().includes(location.toLowerCase()));
    if (priceMin) r = r.filter((i) => i.price != null && i.price >= parseInt(priceMin));
    if (priceMax) r = r.filter((i) => i.price != null && i.price <= parseInt(priceMax));
    return r;
  }, [influencers, search, debouncedSearch, platform, selectedGenres, location, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleGenre = (g: string) => setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  const clearSelection = () => setSelectedIds(new Set());
  const addSelectedToCart = () => { paged.filter((i) => selectedIds.has(i.id) && !isInCart(i.id)).forEach(addToCart); clearSelection(); };

  const handleSelectCount = (val: string) => {
    if (val === "all") setSelectedIds(new Set(paged.map((i) => i.id)));
    else { const n = parseInt(val); if (!isNaN(n)) setSelectedIds(new Set(paged.slice(0, n).map((i) => i.id))); }
  };

  const setTier = (t: Tier | "all") => {
    const next = new URLSearchParams(searchParams);
    if (t === "all") next.delete("tier"); else next.set("tier", t);
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const activeFilterCount = selectedGenres.length + (gender !== "all" ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (location ? 1 : 0);
  const clearFilters = () => { setSelectedGenres([]); setGender("all"); setPriceMin(""); setPriceMax(""); setLocation(""); setPage(1); };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
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

      <MarketplaceFilters
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        selectedGenres={selectedGenres} toggleGenre={toggleGenre}
        gender={gender} setGender={setGender}
        priceMin={priceMin} setPriceMin={(v) => { setPriceMin(v); setPage(1); }}
        priceMax={priceMax} setPriceMax={(v) => { setPriceMax(v); setPage(1); }}
        location={location} setLocation={(v) => { setLocation(v); setPage(1); }}
        onClear={clearFilters} activeCount={activeFilterCount}
      />

      <MarketplaceToolbar
        platform={platform} setPlatform={(p) => { setPlatform(p); setPage(1); }}
        search={search} setSearch={(v) => { setSearch(v); setPage(1); }}
        openDrawer={() => setDrawerOpen(true)} activeFilterCount={activeFilterCount}
        tier={tier} setTier={setTier}
        selectedCount={selectedIds.size} pagedCount={paged.length} filteredCount={filtered.length}
        onSelectCount={handleSelectCount} onClearSelection={clearSelection}
        onAddSelectedToCart={addSelectedToCart}
      />

      <main className="flex-1 p-4 space-y-4">
        <RisingStarsCarousel />

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
                key={inf.id} inf={inf}
                selected={selectedIds.has(inf.id)} inCart={isInCart(inf.id)}
                onToggleSelect={() => toggleSelect(inf.id)}
                onAddToCart={() => { if (!isInCart(inf.id)) addToCart(inf); }}
                onGetInTouch={() => setCelebModal({ id: inf.id, name: inf.name })}
              />
            ))}
          </div>
        )}

        <MarketplacePagination page={page} totalPages={totalPages} setPage={setPage} goToPage={setPage} />
      </main>

      {celebModal && (
        <CelebCallbackModal influencerId={celebModal.id} influencerName={celebModal.name} onClose={() => setCelebModal(null)} />
      )}
    </div>
  );
}
