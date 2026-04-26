import { Link } from "react-router-dom";
import { Plus, Search, MessageSquare, FileText, TrendingUp, Users, DollarSign, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { api, Campaign, Proposal, BrandAnalytics } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Tab = "overview" | "campaigns" | "room";

const STATUS_STYLE: Record<string, string> = {
  draft: "text-chalk-dim border-white/20",
  open: "text-green-400 border-green-400/30",
  in_progress: "text-gold border-gold/30",
  completed: "text-blue-400 border-blue-400/30",
  cancelled: "text-red-400 border-red-400/30",
};

const WORKFLOW_STEPS = ["Creators Selected", "Shooting Videos", "Uploaded", "Payment Done"];

export default function BrandDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [viewingProposals, setViewingProposals] = useState<{ id: string; proposals: Proposal[] } | null>(null);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getCampaigns(), api.getBrandAnalytics()])
      .then(([c, a]) => { setCampaigns(c); setAnalytics(a); })
      .catch(() => toast({ title: "Error", description: "Failed to load data", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const openProposals = async (campaignId: string) => {
    setProposalsLoading(true);
    try {
      const data = await api.getProposalsForCampaign(campaignId);
      setViewingProposals({ id: campaignId, proposals: data });
    } catch { toast({ title: "Error", description: "Failed to load proposals", variant: "destructive" }); }
    finally { setProposalsLoading(false); }
  };

  const respond = async (proposalId: string, status: "accepted" | "rejected") => {
    await api.respondToProposal(proposalId, status);
    toast({ title: "Success", description: `Proposal ${status}` });
    if (viewingProposals) openProposals(viewingProposals.id);
  };

  const statCards = [
    { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "open" || c.status === "in_progress").length, icon: "🚀" },
    { label: "Total Creators", value: analytics?.proposals?.accepted || 0, icon: "👥" },
    { label: "Total Spent", value: `₹${((analytics as Record<string, unknown>)?.totalSpent as number || 0).toLocaleString("en-IN")}`, icon: "💰" },
    { label: "Proposals", value: analytics?.proposals?.total || 0, icon: "📊" },
  ];

  const Tabs = () => (
    <div className="flex gap-2 mb-6">
      {(["overview", "campaigns", "room"] as Tab[]).map((t) => (
        <button key={t} onClick={() => setTab(t)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
          {t === "room" ? "🏠 Your Room" : t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
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
          </div>
        </div>

        <Tabs />

        {loading ? (
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

                {campaigns.filter((c) => c.status === "in_progress" || c.status === "open").length > 0 && (
                  <div className="bento-card p-5">
                    <h2 className="font-display font-bold text-chalk mb-4">Running Campaigns</h2>
                    {campaigns.filter((c) => c.status !== "draft" && c.status !== "cancelled").slice(0, 3).map((c) => (
                      <div key={c._id} className="mb-4 last:mb-0">
                        <p className="text-sm font-medium text-chalk mb-2">{c.title}</p>
                        <div className="flex items-center gap-2">
                          {WORKFLOW_STEPS.map((step, i) => (
                            <div key={step} className="flex items-center gap-2">
                              <div className={`text-xs flex items-center gap-1 ${i === 0 ? "status-done" : i === 1 && c.status === "in_progress" ? "status-pending" : "status-waiting"}`}>
                                {i === 0 ? "✅" : "⏳"} {step}
                              </div>
                              {i < WORKFLOW_STEPS.length - 1 && <div className="w-3 h-px bg-white/10" />}
                            </div>
                          ))}
                        </div>
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
                          <tr key={c._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                            <td className="px-5 py-3 font-medium text-chalk">{c.title}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[c.status] || "text-chalk-dim border-white/10"}`}>
                                {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-chalk-dim">₹{c.budget?.toLocaleString("en-IN") || "—"}</td>
                            <td className="px-5 py-3 text-chalk-dim">{c.deadline ? new Date(c.deadline).toLocaleDateString() : "—"}</td>
                            <td className="px-5 py-3">
                              <button onClick={() => openProposals(c._id)} className="text-xs text-gold hover:underline flex items-center gap-1">
                                {proposalsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />} Proposals
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "room" && (
              <div className="bento-card membership-gold p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏠</span>
                  <h2 className="font-display font-bold text-chalk text-xl">Your Room</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 ml-auto">₹999/month</span>
                </div>
                <p className="text-chalk-dim text-sm mb-4">Premium workspace for power brands</p>
                <ul className="space-y-2 text-sm text-chalk-dim mb-6">
                  {["Save creator lists", "Schedule campaigns", "Payment integration", "Advanced analytics", "Priority notifications", "Dedicated support"].map((f) => (
                    <li key={f} className="flex items-center gap-2"><span className="text-gold">✓</span> {f}</li>
                  ))}
                </ul>
                <button className="gold-pill px-6 py-2.5 text-sm">Activate Your Room →</button>
              </div>
            )}
          </>
        )}

        {/* Proposals Modal */}
        {viewingProposals && (
          <div className="modal-overlay open" onClick={() => setViewingProposals(null)}>
            <div className="modal-box bento-card w-full max-w-lg p-6 mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-chalk">Proposals</h3>
                <button onClick={() => setViewingProposals(null)} className="text-chalk-dim hover:text-chalk text-xl">✕</button>
              </div>
              {viewingProposals.proposals.length === 0 ? (
                <p className="text-chalk-dim text-sm">No proposals yet for this campaign.</p>
              ) : viewingProposals.proposals.map((p) => (
                <div key={p._id} className="bento-card-dark p-4 rounded-lg mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-chalk">{p.influencerName || "Creator"}</p>
                      <p className="text-xs text-chalk-dim mt-1">{p.message}</p>
                      <p className="text-sm font-bold text-gold mt-2">₹{p.bidAmount.toLocaleString("en-IN")}</p>
                    </div>
                    {p.status === "pending" ? (
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => respond(p._id, "accepted")} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => respond(p._id, "rejected")} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${p.status === "accepted" ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>
                        {p.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
