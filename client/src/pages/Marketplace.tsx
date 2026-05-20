import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Influencer } from "@/lib/store";
import { parseUrlTier, toInfluencer } from "@/lib/influencerMappers";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { MarketplaceToolbar, SortBy } from "@/components/marketplace/MarketplaceToolbar";
import { RisingStarsCarousel } from "@/components/RisingStarsCarousel";
import { CelebCallbackModal } from "@/components/CelebCallbackModal";
import { CreatorCard } from "@/components/CreatorCard";
import { CreatorCardSkeleton } from "@/components/CreatorCardSkeleton";
import { keys } from '@/lib/queryKeys';
import { hasRealtime } from '@/lib/supabase';
import { useRealtimePresence } from '@/hooks/useRealtimeCampaignCreator';

interface MarketplaceProps {
  isInCart: (id: string) => boolean;
  addToCart: (i: Influencer) => void;
  removeFromCart: (id: string) => void;
}

const TIERS = ["nano", "micro", "macro", "celeb"] as const;
type Tier = (typeof TIERS)[number];

export default function Marketplace({ isInCart, addToCart, removeFromCart }: MarketplaceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tier: Tier | "all" = parseUrlTier(searchParams.get("tier"));
  const [platform, setPlatform] = useState<"all" | "instagram" | "youtube">("all");
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [celebModal, setCelebModal] = useState<{ id: string; name: string } | null>(null);

  useRealtimePresence();

  const genreKey = selectedGenres.join(',');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search.trim()); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const { data: influencers = [], isLoading: loading } = useQuery({
    queryKey: keys.creators.marketplace({ gender, tier, platform, location, genreKey, debouncedSearch }),
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
    staleTime: 20_000,
    placeholderData: (prev) => prev,
    // Realtime presence channel handles live updates; poll only as a
    // fallback when VITE_SUPABASE_URL/ANON_KEY are unset.
    refetchInterval: hasRealtime() ? false : 60_000,
  });

  const filtered = useMemo(() => {
    let r = influencers;
    if (search.trim() && search.trim() !== debouncedSearch) {
      const q = search.trim().toLowerCase();
      r = r.filter((i) => i.name.toLowerCase().includes(q) || i.handle?.toLowerCase().includes(q) || i.genre?.toLowerCase().includes(q));
    }
    if (platform !== "all") r = r.filter((i) => i.connectedPlatforms?.includes(platform));
    if (selectedGenres.length) r = r.filter((i) =>
      i.niches?.some(n => selectedGenres.includes(n)) || selectedGenres.includes(i.genre)
    );
    if (location) r = r.filter((i) => i.city?.toLowerCase().includes(location.toLowerCase()));
    if (priceMin) r = r.filter((i) => i.price != null && i.price >= parseInt(priceMin));
    if (priceMax) r = r.filter((i) => i.price != null && i.price <= parseInt(priceMax));
    if (sortBy === "followers_desc") r = [...r].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
    else if (sortBy === "er_desc") r = [...r].sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0));
    else if (sortBy === "price_asc") r = [...r].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sortBy === "price_desc") r = [...r].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sortBy === "rating_desc") r = [...r].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    return r;
  }, [influencers, search, debouncedSearch, platform, selectedGenres, location, priceMin, priceMax, sortBy]);

  const toggleGenre = (g: string) => setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  const clearSelection = () => setSelectedIds(new Set());
  const addSelectedToCart = () => { filtered.filter((i) => selectedIds.has(i.id) && !isInCart(i.id)).forEach(addToCart); clearSelection(); };

  const handleSelectCount = (val: string) => {
    if (val === "all") setSelectedIds(new Set(filtered.map((i) => i.id)));
    else { const n = parseInt(val); if (!isNaN(n)) setSelectedIds(new Set(filtered.slice(0, n).map((i) => i.id))); }
  };

  const setTier = (t: Tier | "all") => {
    const next = new URLSearchParams(searchParams);
    if (t === "all") next.delete("tier"); else next.set("tier", t);
    setSearchParams(next, { replace: true });
  };

  const activeFilterCount = selectedGenres.length + (gender !== "all" ? 1 : 0) + (tier !== "all" ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (location ? 1 : 0);
  const clearFilters = () => { setSelectedGenres([]); setGender("all"); setTier("all"); setPriceMin(""); setPriceMax(""); setLocation(""); };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <MarketplaceFilters
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        selectedGenres={selectedGenres} toggleGenre={toggleGenre}
        gender={gender} setGender={setGender}
        tier={tier} setTier={setTier}
        priceMin={priceMin} setPriceMin={setPriceMin}
        priceMax={priceMax} setPriceMax={setPriceMax}
        location={location} setLocation={setLocation}
        onClear={clearFilters} activeCount={activeFilterCount}
      />

      <MarketplaceToolbar
        platform={platform} setPlatform={setPlatform}
        search={search} setSearch={setSearch}
        openDrawer={() => setDrawerOpen(true)} activeFilterCount={activeFilterCount}
        tier={tier} setTier={setTier}
        selectedCount={selectedIds.size} pagedCount={filtered.length} filteredCount={filtered.length}
        onSelectCount={handleSelectCount} onClearSelection={clearSelection}
        onAddSelectedToCart={addSelectedToCart}
        sortBy={sortBy} setSortBy={setSortBy}
      />

      <main className="flex-1 p-4 space-y-4">
        <RisingStarsCarousel />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-chalk-dim">
            <p>No Kalakaars found matching your filters.</p>
            {influencers.length === 0 && (
              <Link to="/influencer-register" className="purple-pill px-5 py-2 text-sm">Be the first Kalakaar →</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((inf) => (
              <CreatorCard
                key={inf.id} inf={inf}
                selected={selectedIds.has(inf.id)} inCart={isInCart(inf.id)}
                onToggleSelect={() => toggleSelect(inf.id)}
                onAddToCart={() => { if (!isInCart(inf.id)) addToCart(inf); }}
                onRemoveFromCart={() => removeFromCart(inf.id)}
                onGetInTouch={() => setCelebModal({ id: inf.id, name: inf.name })}
              />
            ))}
          </div>
        )}
      </main>

      {celebModal && (
        <CelebCallbackModal influencerId={celebModal.id} influencerName={celebModal.name} onClose={() => setCelebModal(null)} />
      )}
    </div>
  );
}
