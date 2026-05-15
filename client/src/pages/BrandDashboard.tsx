import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Search, FileText, Users, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, Campaign, Proposal } from "@/lib/api";
import { BrandProposalsModal } from "@/components/BrandProposalsModal";
import { CampaignInfluencersPanel } from "@/components/CampaignInfluencersPanel";
import { RecommendedCreators } from "@/components/RecommendedCreators";
import { BrandAnalyticsPanel } from "@/components/BrandAnalyticsPanel";
import { BrandRoomPanel } from "@/components/BrandRoomPanel";
import { BrandCampaignHistoryPanel } from "@/components/BrandCampaignHistoryPanel";
import { RunningCampaignTracker } from "@/components/RunningCampaignTracker";

type Tab = "overview" | "campaigns" | "analytics" | "room" | "history";

const STATUS_STYLE: Record<string, string> = {
  open: "text-green-400 border-green-400/30",
  closed: "text-blue-400 border-blue-400/30",
  archived: "text-chalk-dim border-white/20",
};

const VALID_TABS = new Set<Tab>(["overview", "campaigns", "analytics", "room", "history"]);

export default function BrandDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(urlTab && VALID_TABS.has(urlTab) ? urlTab : "overview");
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);
  const [viewingInfluencersCampaign, setViewingInfluencersCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const stateTab = (location.state as { tab?: Tab } | null)?.tab;
    if (stateTab) { setTab(stateTab); window.history.replaceState({}, ''); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["brand-campaigns"],
    queryFn: () => api.getCampaigns(),
  });

  const { data: analytics } = useQuery({
    queryKey: ["brand-analytics"],
    queryFn: () => api.getBrandAnalytics(),
  });

  const { data: viewingProposals = [] } = useQuery<Proposal[]>({
    queryKey: ["campaign-proposals", viewingCampaignId],
    queryFn: () => api.getProposalsForCampaign(viewingCampaignId!),
    enabled: !!viewingCampaignId,
  });

  const { data: brandProfile } = useQuery({
    queryKey: ["brand-profile"],
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
              <h1 className="font-display text-2xl font-bold text-chalk truncate">{user?.brandName || user?.name || "My Brand"}</h1>
              <p className="text-chalk-dim text-xs mt-0.5">Welcome, {user?.name || "Team"}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk text-sm transition-colors">
              <Search className="w-4 h-4" /> Find Creators
            </Link>
            <button onClick={() => setTab("campaigns")} className="purple-pill flex items-center gap-2 px-4 py-2 text-sm">
              <BarChart2 className="w-4 h-4" /> Campaigns
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(["overview", "campaigns", "analytics", "room", "history"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
              {t === "room" ? "🏠 Your Room" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {campaignsLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
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
              <div className="bento-card overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h2 className="font-display font-bold text-chalk">My Campaigns</h2>
                </div>
                {campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-chalk-dim">
                    <FileText className="w-10 h-10 mb-3 opacity-30" />
                    <p>No campaigns yet.</p>
                    <Link to="/brand/create-campaign" className="purple-pill mt-4 px-5 py-2 text-sm">Upload Campaign Brief</Link>
                  </div>
                ) : (
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
                                <button onClick={() => setViewingCampaignId(c.id)}
                                  className="text-xs text-gold hover:underline flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Proposals
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
                )}
              </div>
            )}

            {tab === "analytics" && <BrandAnalyticsPanel />}
            {tab === "room" && <BrandRoomPanel />}
            {tab === "history" && <BrandCampaignHistoryPanel />}
          </>
        )}
      </div>

      {viewingCampaignId && (
        <BrandProposalsModal
          campaignId={viewingCampaignId}
          proposals={viewingProposals}
          onClose={() => setViewingCampaignId(null)}
        />
      )}
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
