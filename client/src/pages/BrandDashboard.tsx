import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, MessageSquare, FileText, Users, Loader2, LogOut, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, Campaign, Proposal } from "@/lib/api";
import { BrandProposalsModal } from "@/components/BrandProposalsModal";
import { RecommendedCreators } from "@/components/RecommendedCreators";
import { BrandAnalyticsPanel } from "@/components/BrandAnalyticsPanel";
import { BrandRoomPanel } from "@/components/BrandRoomPanel";
import { BrandCampaignHistoryPanel } from "@/components/BrandCampaignHistoryPanel";

type Tab = "overview" | "campaigns" | "analytics" | "room" | "history";

const STATUS_STYLE: Record<string, string> = {
  open: "text-green-400 border-green-400/30",
  closed: "text-blue-400 border-blue-400/30",
  archived: "text-chalk-dim border-white/20",
};

export default function BrandDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("overview");
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);

  useEffect(() => {
    const t = (location.state as { tab?: Tab } | null)?.tab;
    if (t) { setTab(t); window.history.replaceState({}, ''); }
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

  const statCards = [
    { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "open").length, icon: "🚀" },
    { label: "Creators Hired", value: analytics?.proposals?.accepted || 0, icon: "👥" },
    { label: "Total Spent", value: `₹${(analytics?.spend || 0).toLocaleString("en-IN")}`, icon: "💰" },
    { label: "Proposals", value: analytics?.proposals?.total || 0, icon: "📊" },
  ];

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-chalk">Brand Dashboard</h1>
            <p className="text-chalk-dim text-sm mt-1">Welcome back, {user?.brandName || user?.name || "Brand"}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/messages" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk text-sm transition-colors">
              <MessageSquare className="w-4 h-4" />
            </Link>
            <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk text-sm transition-colors">
              <Search className="w-4 h-4" /> Browse
            </Link>
            <Link to="/brand-campaign" className="purple-pill flex items-center gap-2 px-4 py-2 text-sm">
              <Plus className="w-4 h-4" /> New Campaign
            </Link>
            <button onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
              <LogOut className="w-4 h-4" />
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statCards.map(({ label, value, icon }) => (
                    <div key={label} className="bento-card p-4">
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="result-numeral text-2xl">{value}</p>
                      <p className="text-xs text-chalk-dim mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                <RecommendedCreators />
                {campaigns.filter((c) => c.status !== "archived").length > 0 && (
                  <div className="bento-card p-5">
                    <h2 className="font-display font-bold text-chalk mb-4">Running Campaigns</h2>
                    {campaigns.filter((c) => c.status !== "archived").slice(0, 3).map((c) => (
                      <div key={c.id} className="flex items-center justify-between mb-3 last:mb-0">
                        <div>
                          <p className="text-sm font-medium text-chalk">{c.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[c.status] || ""}`}>
                            {c.status}
                          </span>
                        </div>
                        <Link to={`/brand/campaigns/${c.id}/track`}
                          className="flex items-center gap-1 text-xs text-gold hover:underline">
                          <BarChart2 className="w-3 h-3" /> Track →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
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
                    <Link to="/brand-campaign" className="purple-pill mt-4 px-5 py-2 text-sm">Create First Campaign</Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/5">
                        {["Campaign", "Status", "Budget", "Deadline", "Actions"].map((h) => (
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
                            <td className="px-5 py-3 text-chalk-dim">₹{c.budget?.toLocaleString("en-IN") || "—"}</td>
                            <td className="px-5 py-3 text-chalk-dim">{c.deadline ? new Date(c.deadline).toLocaleDateString() : "—"}</td>
                            <td className="px-5 py-3 flex items-center gap-3">
                              <button onClick={() => setViewingCampaignId(c.id)}
                                className="text-xs text-gold hover:underline flex items-center gap-1">
                                <Users className="w-3 h-3" /> Proposals
                              </button>
                              <Link to={`/brand/campaigns/${c.id}/track`}
                                className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                                <BarChart2 className="w-3 h-3" /> Track
                              </Link>
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
    </main>
  );
}
