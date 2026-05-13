import { useState } from "react";
import { Instagram, Youtube } from "lucide-react";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { PerformanceBarChart, GenderPieChart } from "@/components/SocialMediaCharts";
import { SocialStats } from "@/lib/api";

type Platform = "instagram" | "youtube";

interface Analytics {
  engagementRate: number;
  avgViews: number;
  totalFollowers: number;
  reachEstimate: number;
  source?: string;
  authenticityScore?: number;
}

interface Props {
  socialStats: SocialStats | undefined | null;
  serverAnalytics: Partial<Analytics> | null;
  socialHandles: { instagram?: string; youtube?: string };
}

const MOCK_IG = { followers: 18_400, following: 620, posts: 94, engagementRate: 4.8 };
const MOCK_YT = { subscribers: 24_500, videos: 86, totalViews: 1_240_000 };

export function AnalyticsSection({ socialStats, serverAnalytics, socialHandles }: Props) {
  const igConnected = !!socialHandles?.instagram;
  const ytConnected = !!socialHandles?.youtube;
  const initial: Platform = igConnected || !ytConnected ? "instagram" : "youtube";
  const [platform, setPlatform] = useState<Platform>(initial);

  const ig = socialStats?.instagram ?? MOCK_IG;
  const yt = socialStats?.youtube ?? MOCK_YT;
  const isIgMock = !socialStats?.instagram;
  const isYtMock = !socialStats?.youtube;

  const igAnalytics: Analytics = {
    engagementRate: serverAnalytics?.engagementRate ?? ig.engagementRate ?? 4.5,
    avgViews: serverAnalytics?.avgViews ?? Math.round(ig.followers * 0.15),
    totalFollowers: serverAnalytics?.totalFollowers ?? ig.followers,
    reachEstimate: serverAnalytics?.reachEstimate ?? Math.round(ig.followers * 2.3),
    source: serverAnalytics?.source,
    authenticityScore: serverAnalytics?.authenticityScore,
  };

  const ytAnalytics: Analytics = {
    engagementRate: 3.2,
    avgViews: yt.videos > 0 ? Math.round((yt.totalViews ?? 0) / yt.videos) : 0,
    totalFollowers: yt.subscribers,
    reachEstimate: Math.round(yt.subscribers * 1.8),
  };

  const a = platform === "instagram" ? igAnalytics : ytAnalytics;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="section-eyebrow text-[10px] mb-1">Performance</p>
          <h2 className="section-title text-2xl">Analytics</h2>
        </div>
        <div className="glass-card flex p-1 rounded-full">
          {(["instagram", "youtube"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`tab-pill flex items-center gap-1.5 px-4 py-2 text-xs ${platform === p ? "active" : ""}`}
            >
              {p === "instagram" ? <Instagram className="w-3.5 h-3.5" /> : <Youtube className="w-3.5 h-3.5" />}
              {p === "instagram" ? "Instagram" : "YouTube"}
              {((p === "instagram" && !igConnected) || (p === "youtube" && !ytConnected)) && (
                <span className="text-[9px] text-chalk-faint">·sample</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsCard
          title={platform === "instagram" ? "Followers" : "Subscribers"}
          value={a.totalFollowers.toLocaleString()}
          icon="fake"
        />
        <AnalyticsCard title="Avg Views" value={a.avgViews.toLocaleString()} icon="views" />
        <AnalyticsCard
          title="Engagement Rate"
          value={`${a.engagementRate}%`}
          icon="er"
          subtitle={a.source ? `Based on ${a.source}` : undefined}
        />
        <AnalyticsCard
          title="Reach Estimate"
          value={a.reachEstimate.toLocaleString()}
          icon="views"
          subtitle={a.authenticityScore ? `Authenticity: ${a.authenticityScore}%` : undefined}
        />
      </div>

      <PerformanceBarChart
        ig={platform === "instagram" ? ig : { followers: yt.subscribers, following: 0, posts: yt.videos, engagementRate: ytAnalytics.engagementRate }}
        isMock={platform === "instagram" ? isIgMock : isYtMock}
      />
      <GenderPieChart />
    </div>
  );
}
