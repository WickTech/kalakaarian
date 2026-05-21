import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Search, Users, BarChart2, Wallet, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, Campaign } from "@/lib/api";
import { CampaignInfluencersPanel } from "@/components/CampaignInfluencersPanel";
import { RecommendedCreators } from "@/components/RecommendedCreators";
import { BrandAnalyticsPanel } from "@/components/BrandAnalyticsPanel";
import { BrandRoomPanel } from "@/components/BrandRoomPanel";
import { BrandTransactionsPanel } from "@/components/BrandTransactionsPanel";
import { PreviousCampaignsPanel } from "@/components/PreviousCampaignsPanel";
import { CurrentCampaignPopover } from "@/components/CurrentCampaignPopover";
import { RunningCampaignTracker } from "@/components/RunningCampaignTracker";
import { keys } from '@/lib/queryKeys';
import { KpiCardSkeleton, TableRowSkeleton } from '@/components/Skeleton';

type Tab = "overview" | "campaigns" | "analytics" | "room" | "transactions";

const STATUS_STYLE: Record<string, string> = {
  open: "text-green-400 border-green-400/30",
  closed: "text-blue-400 border-blue-400/30",
  archived: "text-chalk-dim border-white/20",
};

const VALID_TABS = new Set<Tab>(["overview", "campaigns", "analytics", "room", "transactions"]);

function normalizeTab(raw: string | null): Tab {
  if (raw === "history") return "transactions";
  if (raw && VALID_TABS.has(raw as Tab)) return raw as Tab;
  return "overview";
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(normalizeTab(searchParams.get("tab")));
  const [viewingInfluencersCampaign, setViewingInfluencersCampaign] = useState<Campaign | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverAnchor = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stateTab = (location.state as { tab?: Tab } | null)?.tab;
    if (stateTab) { setTab(stateTab); window.history.replaceState({}, ''); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: keys.campaigns.byBrand(),
    queryFn: () => api.getCampaigns(),
  });

  const { data: analytics } = useQuery({
    queryKey: keys.brand.analytics(),
    queryFn: () => api.getBrandAnalytics(),
  });

  const { data: brandProfile } = useQuery({
    queryKey: keys.brand.profile(),
    queryFn: () => api.getBrandProfile().catch(() => null),
    staleTime: 5 * 60_000,
  });

  const statCards = [
    { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "open").length, icon: "🚀" },
    { label: "Total Spent", value: `₹${(analytics?.spend || 0).toLocaleString("en-IN")}`, icon: "💰" },
  ];

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {brandProfile?.logo ? (
              <img src={brandProfile.logo} alt="logo" className="w-10 h-10 rounded-xl object-cover bg-charcoal shrink-0" />
            ) : (
              <Link to="/profile/edit" className="w-10 h-10 rounded-xl bg-charcoal border border-dashed border-white/20 flex items-center justify-center text-chalk-faint text-xs hover:border-gold/40 hover:text-gold transition-colors shrink-0" title="Add brand logo">
                +
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-chalk truncate">{brandProfile?.companyName || user?.brandName || user?.name || "My Brand"}</h1>
              <p className="text-chalk-dim text-xs mt-0.5">Welcome, {user?.name || "Team"}</p>
            </div>
          </div>
          <div className="relative flex gap-2 flex-wrap shrink-0">
            <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk text-sm transition-colors">
              <Search className="w-4 h-4" /> Find Creators
            </Link>
            <button
              ref={popoverAnchor}
              onClick={() => setPopoverOpen((o) => !o)}
              className="purple-pill flex items-center gap-2 px-4 py-2 text-sm"
            >
              <BarChart2 className="w-4 h-4" /> Campaigns
            </button>
            <CurrentCampaignPopover
              open={popoverOpen}
              onClose={() => setPopoverOpen(false)}
              anchorRef={popoverAnchor}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["overview", "campaigns", "analytics", "room", "transactions"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
              {t === "room" ? "🏠 Your Room" :
               t === "transactions" ? "Transactions" :
               t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {campaignsLoading ? (
          <div className="space-y-6">
            {tab === "overview" ? (
              <div className="grid grid-cols-2 gap-4">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </div>
            ) : (
              <div className="bento-card overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {statCards.map(({ label, value, icon }) => (
                    <div key={label} className="bento-card p-5">
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="result-numeral text-3xl">{value}</p>
                      <p className="text-xs text-chalk-dim mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                <RunningCampaignTracker campaigns={campaigns} />
                <RecommendedCreators />
              </div>
            )}

            {tab === "campaigns" && (
              <div className="space-y-6">
                {campaigns.length === 0 ? (
                  <div className="bento-card flex flex-col items-center justify-center p-12 text-chalk-dim">
                    <FileText className="w-10 h-10 mb-3 opacity-30" />
                    <p>No campaigns yet.</p>
                    <Link to="/marketplace" className="purple-pill mt-4 px-5 py-2 text-sm">Find Creators</Link>
                    <Link to="/brand/create-campaign" className="mt-3 text-xs text-chalk-dim hover:text-chalk underline">
                      Or post an open brief
                    </Link>
                  </div>
                ) : (
                  <>
                    <RunningCampaignTracker campaigns={campaigns.filter((c) => c.status === "open")} />

                    <div className="bento-card overflow-hidden">
                      <div className="p-5 border-b border-white/5">
                        <h2 className="font-display font-bold text-chalk">All Campaigns</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-white/5">
                            {["Campaign", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-5 py-3 text-left text-xs text-chalk-faint font-medium">{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {campaigns.map((c) => (
                              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                <td className="px-5 py-3 font-medium text-chalk">{c.title}</td>
                                <td className="px-5 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[c.status] || "text-chalk-dim border-white/10"}`}>
                                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => setViewingInfluencersCampaign(c)}
                                      className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                                      <Users className="w-3 h-3" /> Creators
                                    </button>
                                    <Link to={`/brand/campaigns/${c.id}/track`}
                                      className="text-xs text-chalk-dim hover:text-chalk flex items-center gap-1">
                                      <BarChart2 className="w-3 h-3" /> Track
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <PreviousCampaignsPanel />
                  </>
                )}
              </div>
            )}

            {tab === "analytics" && <BrandAnalyticsPanel />}
            {tab === "room" && <BrandRoomPanel />}
            {tab === "transactions" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <h2 className="font-display font-bold text-chalk">Transactions</h2>
                </div>
                <BrandTransactionsPanel />
              </div>
            )}
          </>
        )}
      </div>

      {viewingInfluencersCampaign && (
        <CampaignInfluencersPanel
          campaignId={viewingInfluencersCampaign.id}
          campaignTitle={viewingInfluencersCampaign.title}
          onClose={() => setViewingInfluencersCampaign(null)}
        />
      )}
    </main>
  );
}
