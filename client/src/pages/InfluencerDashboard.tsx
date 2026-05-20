import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, InfluencerProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WalletTab, MembershipTab } from "@/components/InfluencerDashboardPanels";
import { InfluencerAnalyticsPanel } from "@/components/InfluencerAnalyticsPanel";
import { GamificationPanel } from "@/components/GamificationPanel";
import { keys } from '@/lib/queryKeys';
import { KpiCardSkeleton, Skeleton } from '@/components/Skeleton';

type Tab = "analytics" | "rewards" | "wallet" | "membership";

const TABS: { key: Tab; label: string }[] = [
  { key: "analytics", label: "📈 Overview" },
  { key: "rewards", label: "🏆 Rewards" },
  { key: "wallet", label: "💰 Wallet" },
  { key: "membership", label: "🎖 Membership" },
];

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const validTabs: Tab[] = ["analytics", "rewards", "wallet", "membership"];
  const initialTab = (validTabs.includes(rawTab as Tab) ? rawTab : "analytics") as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery<InfluencerProfile | null>({
    queryKey: keys.creators.profileOwn(),
    queryFn: () => api.getInfluencerProfile().catch(() => null),
  });
  // Handle OAuth redirect params from IG/YT platform connection
  useEffect(() => {
    const igConnected = searchParams.get("ig_connected");
    const ytConnected = searchParams.get("yt_connected");
    const igError = searchParams.get("ig_error");
    const ytError = searchParams.get("yt_error");
    if (!igConnected && !ytConnected && !igError && !ytError) return;

    if (igConnected === "1") {
      toast({ title: "Instagram connected", description: "Your Instagram account is now linked." });
      qc.invalidateQueries({ queryKey: keys.platforms.connected() });
    }
    if (ytConnected === "1") {
      toast({ title: "YouTube connected", description: "Your YouTube channel is now linked." });
      qc.invalidateQueries({ queryKey: keys.platforms.connected() });
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
    queryKey: keys.analytics.influencer(),
    queryFn: () => api.getInfluencerAnalytics().catch(() => null),
  });

  const { data: membershipStatus = null } = useQuery<{ tier: string; active?: boolean; endDate?: string } | null>({
    queryKey: keys.membership.status(),
    queryFn: () => api.getMembershipStatus().catch(() => null),
  });

  const stats = {
    earnings: analytics?.totalEarnings ?? 0,
    pendingTotal: analytics?.pendingPayouts ?? 0,
  };



  if (isLoading) return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="bento-card p-5 flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="bento-card p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img src={profile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="avatar" className="w-16 h-16 rounded-full object-cover bg-charcoal" />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-obsidian ${profile?.isOnline ? "bg-green-400" : "bg-chalk-faint"}`} />
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
      </div>
    </main>
  );
}
