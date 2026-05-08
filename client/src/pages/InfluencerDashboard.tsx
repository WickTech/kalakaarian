import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Edit, LogOut, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, Proposal, InfluencerProfile } from "@/lib/api";
import { WalletTab, UploadTab, MembershipTab, SettingsTab } from "@/components/InfluencerDashboardPanels";
import { InfluencerAnalyticsPanel } from "@/components/InfluencerAnalyticsPanel";
import { GamificationPanel } from "@/components/GamificationPanel";

type Tab = "proposals" | "analytics" | "rewards" | "wallet" | "upload" | "membership" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "proposals", label: "📋 Proposals" },
  { key: "analytics", label: "📈 Analytics" },
  { key: "rewards", label: "🏆 Rewards" },
  { key: "wallet", label: "💰 Wallet" },
  { key: "upload", label: "🎥 Upload" },
  { key: "membership", label: "🎖 Membership" },
  { key: "settings", label: "⚙️ Settings" },
];

const STAGE_BADGE: Record<string, string> = {
  shortlisted: "text-amber-400 border-amber-400/30",
  accepted: "text-blue-400 border-blue-400/30",
  content_in_progress: "text-purple-400 border-purple-400/30",
  submitted: "text-cyan-400 border-cyan-400/30",
  under_review: "text-orange-400 border-orange-400/30",
  approved: "text-green-400 border-green-400/30",
  payment_pending: "text-yellow-400 border-yellow-400/30",
  payment_released: "text-emerald-400 border-emerald-400/30",
  rejected_workflow: "text-red-400 border-red-400/30",
};

const STAGE_LABEL: Record<string, string> = {
  shortlisted: "Shortlisted", accepted: "Accepted",
  content_in_progress: "Content In Progress", submitted: "Submitted",
  under_review: "Under Review", approved: "Approved",
  payment_pending: "Payment Pending", payment_released: "Payment Released",
  rejected_workflow: "Rejected",
};


export default function InfluencerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "proposals";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [isOnline, setIsOnline] = useState(false);
  const [activeSince, setActiveSince] = useState<string | null>(null);

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["my-proposals"],
    queryFn: () => api.getProposals().catch(() => []),
  });

  const { data: profile } = useQuery<InfluencerProfile | null>({
    queryKey: ["influencer-profile-own"],
    queryFn: () => api.getInfluencerProfile().catch(() => null),
  });
  useEffect(() => {
    if (profile?.isOnline !== undefined) setIsOnline(profile.isOnline!);
  }, [profile]);

  const { data: analytics } = useQuery({
    queryKey: ["influencer-analytics"],
    queryFn: () => api.getInfluencerAnalytics().catch(() => null),
  });

  const { data: membershipStatus = null } = useQuery<{ tier: string; active?: boolean; endDate?: string } | null>({
    queryKey: ["membership-status"],
    queryFn: () => api.getMembershipStatus().catch(() => null),
  });

  const stats = {
    total: proposals.length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    earnings: analytics?.totalEarnings ?? proposals.filter((p) => p.status === "accepted").reduce((s, p) => s + p.bidAmount, 0),
    pendingTotal: proposals.filter((p) => p.status === "submitted").reduce((s, p) => s + p.bidAmount, 0),
  };

  const togglePresence = async () => {
    const next = !isOnline;
    await api.updatePresence(next);
    setIsOnline(next);
    if (next) {
      setActiveSince(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } else {
      setActiveSince(null);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="bento-card p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img src={profile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="avatar" className="w-16 h-16 rounded-full object-cover bg-charcoal" />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-obsidian ${isOnline ? "bg-green-400" : "bg-chalk-faint"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-chalk text-xl">{profile?.name || user?.name}</h1>
                {membershipStatus?.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                    {membershipStatus?.tier?.toUpperCase()}
                  </span>
                )}
                {profile?.avgRating && (
                  <span className="flex items-center gap-0.5 text-xs text-gold">
                    <Star className="w-3 h-3 fill-gold" />
                    {Number(profile.avgRating).toFixed(1)}
                    <span className="text-chalk-faint">({profile.ratingCount})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-chalk-dim mt-0.5">{profile?.niches?.join(", ") || "—"} · {profile?.city || "—"}</p>
              <p className="text-xs text-chalk-faint mt-0.5">{(profile?.followerCount || 0).toLocaleString("en-IN")} followers</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-chalk-dim">Active</span>
              <button onClick={togglePresence} className={`w-10 h-5 rounded-full transition-all ${isOnline ? "bg-green-500" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${isOnline ? "translate-x-4" : ""}`} />
              </button>
              {isOnline && activeSince && (
                <span className="text-[10px] text-green-400">since {activeSince}</span>
              )}
              <Link to="/profile/edit" className="p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
                <Edit className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => { logout(); navigate("/"); }} className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === key ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "proposals" && (
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <div className="bento-card-dark p-6 rounded-xl text-center text-chalk-dim text-sm">
                No proposals yet. <Link to="/campaigns" className="text-purple-400 hover:text-purple-300">Browse campaigns →</Link>
              </div>
            ) : (
              proposals.map((p) => (
                <Link key={p._id} to={`/proposals/${p._id}`}
                  className="bento-card-dark p-4 rounded-xl flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors block">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-chalk truncate">{p.campaignTitle || "Campaign"}</p>
                    <p className="text-xs text-chalk-dim mt-0.5">₹{p.bidAmount.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.workflow_stage ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STAGE_BADGE[p.workflow_stage] ?? "text-chalk-dim border-white/20"}`}>
                        {STAGE_LABEL[p.workflow_stage] ?? p.workflow_stage}
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        p.status === "accepted" ? "text-green-400 border-green-400/30" :
                        p.status === "rejected" ? "text-red-400 border-red-400/30" :
                        "text-chalk-dim border-white/20"
                      }`}>{p.status}</span>
                    )}
                    <span className="text-chalk-dim text-xs">→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
        {tab === "analytics" && <InfluencerAnalyticsPanel proposals={proposals} stats={stats} />}
        {tab === "rewards" && <GamificationPanel />}

        {tab === "wallet" && <WalletTab earnings={stats.earnings} pendingTotal={stats.pendingTotal} />}
        {tab === "upload" && <UploadTab />}
        {tab === "membership" && <MembershipTab membershipStatus={membershipStatus} />}
        {tab === "settings" && <SettingsTab profile={profile} />}
      </div>
    </main>
  );
}
