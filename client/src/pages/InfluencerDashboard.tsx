import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Edit, Settings as SettingsIcon, Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, InfluencerProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WalletTab, MembershipTab, SettingsTab } from "@/components/InfluencerDashboardPanels";
import { InfluencerAnalyticsPanel } from "@/components/InfluencerAnalyticsPanel";
import { GamificationPanel } from "@/components/GamificationPanel";

type Tab = "analytics" | "rewards" | "wallet" | "membership" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "analytics", label: "📈 Overview" },
  { key: "rewards", label: "🏆 Rewards" },
  { key: "wallet", label: "💰 Wallet" },
  { key: "membership", label: "🎖 Membership" },
  { key: "settings", label: "⚙️ Settings" },
];

function fmtSince(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "analytics";
  const [tab, setTab] = useState<Tab>(initialTab);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isOnline, setIsOnline] = useState(false);
  const [onlineSince, setOnlineSince] = useState<string | null>(null);
  const [offlineSince, setOfflineSince] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const { data: profile, isLoading } = useQuery<InfluencerProfile | null>({
    queryKey: ["influencer-profile-own"],
    queryFn: () => api.getInfluencerProfile().catch(() => null),
  });
  useEffect(() => {
    if (profile?.isOnline !== undefined) setIsOnline(profile.isOnline!);
    setOnlineSince(profile?.onlineSince ?? null);
    setOfflineSince(profile?.lastSeenAt ?? null);
  }, [profile]);

  // Handle OAuth redirect params from IG/YT platform connection
  useEffect(() => {
    const igConnected = searchParams.get("ig_connected");
    const ytConnected = searchParams.get("yt_connected");
    const igError = searchParams.get("ig_error");
    const ytError = searchParams.get("yt_error");
    if (!igConnected && !ytConnected && !igError && !ytError) return;

    if (igConnected === "1") {
      toast({ title: "Instagram connected", description: "Your Instagram account is now linked." });
      qc.invalidateQueries({ queryKey: ["connected-platforms"] });
    }
    if (ytConnected === "1") {
      toast({ title: "YouTube connected", description: "Your YouTube channel is now linked." });
      qc.invalidateQueries({ queryKey: ["connected-platforms"] });
    }
    if (igError) {
      toast({ title: "Instagram connection failed", description: igError, variant: "destructive" });
    }
    if (ytError) {
      toast({ title: "YouTube connection failed", description: ytError, variant: "destructive" });
    }
    // Strip params from URL without re-render loop
    const clean = new URLSearchParams(searchParams);
    clean.delete("ig_connected"); clean.delete("yt_connected");
    clean.delete("ig_error"); clean.delete("yt_error");
    navigate({ search: clean.toString() }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: analytics } = useQuery({
    queryKey: ["influencer-analytics"],
    queryFn: () => api.getInfluencerAnalytics().catch(() => null),
  });

  const { data: membershipStatus = null } = useQuery<{ tier: string; active?: boolean; endDate?: string } | null>({
    queryKey: ["membership-status"],
    queryFn: () => api.getMembershipStatus().catch(() => null),
  });

  const stats = {
    earnings: analytics?.totalEarnings ?? 0,
    pendingTotal: analytics?.pendingPayouts ?? 0,
  };

  const togglePresence = async () => {
    if (toggling) return;
    const next = !isOnline;
    const now = new Date().toISOString();
    setIsOnline(next);
    if (next) { setOnlineSince(now); setOfflineSince(null); }
    else { setOfflineSince(now); setOnlineSince(null); }
    setToggling(true);
    try {
      await api.updatePresence(next);
    } catch {
      setIsOnline(!next);
      if (!next) { setOnlineSince(now); setOfflineSince(null); }
      else { setOfflineSince(now); setOnlineSince(null); }
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setToggling(false);
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
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <span className="text-xs text-chalk-dim">Active</span>
              <button onClick={togglePresence} disabled={toggling} className={`w-10 h-5 rounded-full transition-all ${toggling ? "opacity-50 cursor-not-allowed" : ""} ${isOnline ? "bg-green-500" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${isOnline ? "translate-x-4" : ""}`} />
              </button>
              <span className={`text-[10px] ${isOnline ? "text-green-400" : "text-chalk-faint"}`}>
                {isOnline ? `Active since ${fmtSince(onlineSince)}` : `Offline since ${fmtSince(offlineSince)}`}
              </span>
              <Link to="/profile/edit" className="p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors" aria-label="Edit profile">
                <Edit className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setTab("settings")}
                className="p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors"
                aria-label="Settings"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
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

        {tab === "analytics" && <InfluencerAnalyticsPanel stats={stats} />}
        {tab === "rewards" && <GamificationPanel />}

        {tab === "wallet" && <WalletTab earnings={stats.earnings} pendingTotal={stats.pendingTotal} />}
        {tab === "membership" && <MembershipTab membershipStatus={membershipStatus} />}
        {tab === "settings" && <SettingsTab profile={profile} />}
      </div>
    </main>
  );
}
