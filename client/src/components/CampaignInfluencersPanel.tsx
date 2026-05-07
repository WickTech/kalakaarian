import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Users, Search, ArrowUpDown, Trash2, Instagram, Youtube, Globe } from "lucide-react";
import { api, CampaignInfluencer } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  campaignId: string;
  campaignTitle: string;
  onClose: () => void;
}

type StatusFilter = "all" | "paid" | "pending";
type SortKey = "price" | "followers";

const TIER_COLORS: Record<string, string> = {
  nano: "text-green-400 border-green-400/30",
  micro: "text-blue-400 border-blue-400/30",
  macro: "text-purple-400 border-purple-400/30",
  celeb: "text-gold border-gold/30",
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;

export function CampaignInfluencersPanel({ campaignId, campaignTitle, onClose }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery<CampaignInfluencer[]>({
    queryKey: ["campaign-influencers", campaignId],
    queryFn: () => api.getCampaignInfluencers(campaignId),
    staleTime: 15_000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeFromCart(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign-influencers", campaignId] });
      qc.invalidateQueries({ queryKey: ["brand-campaigns"] });
      toast({ title: "Creator removed from campaign" });
    },
    onError: () => toast({ title: "Failed to remove creator", variant: "destructive" }),
  });

  const displayed = data
    .filter((i) => statusFilter === "all" || i.paymentStatus === statusFilter)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "price" ? b.cartPrice - a.cartPrice : b.followerCount - a.followerCount);

  const totalBudget = data.reduce((s, i) => s + i.cartPrice, 0);
  const paidCount = data.filter((i) => i.paymentStatus === "paid").length;
  const pendingCount = data.filter((i) => i.paymentStatus === "pending").length;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div
        className="bento-card w-full max-w-2xl mx-4 p-0 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-chalk text-lg">{campaignTitle}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-chalk-dim">
              <span><Users className="w-3.5 h-3.5 inline mr-1" />{data.length} creators</span>
              <span className="text-gold font-medium">₹{totalBudget.toLocaleString("en-IN")}</span>
              {paidCount > 0 && <span className="text-green-400">{paidCount} paid</span>}
              {pendingCount > 0 && <span className="text-amber-400">{pendingCount} pending</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-chalk-dim hover:text-chalk transition-colors shrink-0 text-xl mt-0.5">✕</button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-b border-white/5 flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {(["all", "paid", "pending"] as StatusFilter[]).map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? "bg-purple-600 text-white"
                    : "border border-white/10 text-chalk-dim hover:text-chalk"
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-faint" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators…"
                className="bg-transparent border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-chalk placeholder-chalk-faint focus:outline-none focus:border-purple-500 w-36"
              />
            </div>
            <button onClick={() => setSortBy(sortBy === "price" ? "followers" : "price")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 text-xs text-chalk-dim hover:text-chalk transition-colors">
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === "price" ? "Price" : "Followers"}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bento-card-dark h-20 rounded-xl animate-pulse" />
            ))
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-chalk-dim gap-3">
              <Users className="w-10 h-10 opacity-20" />
              <p className="text-sm">{search ? "No creators match your search" : "No creators added yet"}</p>
              {!search && statusFilter === "all" && (
                <p className="text-xs opacity-60">Add creators from the Marketplace</p>
              )}
            </div>
          ) : (
            displayed.map((inf) => <InfluencerRow key={inf.id} inf={inf} onRemove={() => removeMutation.mutate(inf.id)} removing={removeMutation.isPending && removeMutation.variables === inf.id} />)
          )}
        </div>
      </div>
    </div>
  );
}

function InfluencerRow({ inf, onRemove, removing }: { inf: CampaignInfluencer; onRemove: () => void; removing: boolean }) {
  const avatar = inf.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.id}`;
  const platforms: string[] = Array.isArray(inf.platform) ? inf.platform : [];

  return (
    <div className="bento-card-dark p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors group">
      <img src={avatar} alt={inf.name}
        className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.id}`; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-chalk text-sm truncate">{inf.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${TIER_COLORS[inf.tier] || "text-chalk-dim border-white/10"}`}>
            {inf.tier}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
            inf.paymentStatus === "paid" ? "text-green-400 border-green-400/30" : "text-amber-400 border-amber-400/30"
          }`}>
            {inf.paymentStatus}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-chalk-dim flex-wrap">
          <div className="flex items-center gap-0.5">
            {platforms.includes("instagram") ? <Instagram className="w-3 h-3" /> :
             platforms.includes("youtube") ? <Youtube className="w-3 h-3" /> :
             <Globe className="w-3 h-3" />}
            <span>{fmt(inf.followerCount)}</span>
          </div>
          {inf.niches.slice(0, 2).map((n) => (
            <span key={n} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px]">{n}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-gold">₹{inf.cartPrice.toLocaleString("en-IN")}</span>
        {inf.paymentStatus === "pending" && (
          <button onClick={onRemove} disabled={removing}
            className="p-1.5 rounded-lg border border-white/10 text-chalk-faint hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-40"
            title="Remove creator">
            {removing ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
