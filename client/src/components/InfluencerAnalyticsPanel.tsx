import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ShieldCheck, Instagram, Youtube } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { EarningsChart } from "./EarningsChart";
import { PlatformAnalyticsTab } from "./PlatformAnalyticsTab";

interface Props {
  stats: { earnings: number };
}

type PlatformTab = "overview" | "instagram" | "youtube";

export function InfluencerAnalyticsPanel({ stats }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [platformTab, setPlatformTab] = useState<PlatformTab>("overview");

  useEffect(() => {
    const ig = searchParams.get('ig_connected');
    const yt = searchParams.get('yt_connected');
    const igErr = searchParams.get('ig_error');
    const ytErr = searchParams.get('yt_error');
    if (ig || yt) {
      const platform: PlatformTab = ig ? 'instagram' : 'youtube';
      toast({ title: `${ig ? 'Instagram' : 'YouTube'} connected!`, description: 'Real audience analytics are now active.' });
      setPlatformTab(platform);
      queryClient.invalidateQueries({ queryKey: ['connected-platforms'] });
      navigate('/influencer/dashboard?tab=analytics', { replace: true });

      const start = Date.now();
      const id = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['connected-platforms'] });
        queryClient.invalidateQueries({ queryKey: ['platform-metrics', platform] });
        if (Date.now() - start >= 30_000) window.clearInterval(id);
      }, 5_000);
      return () => window.clearInterval(id);
    } else if (igErr || ytErr) {
      toast({ title: `${igErr ? 'Instagram' : 'YouTube'} connection failed`, description: 'Make sure you have the right account type and try again.', variant: 'destructive' });
      navigate('/influencer/dashboard?tab=analytics', { replace: true });
    }
  }, []);

  const { data: platforms } = useConnectedPlatforms();

  const { data: deep } = useQuery({
    queryKey: ["influencer-deep-analytics"],
    queryFn: () => api.getInfluencerDeepAnalytics(),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "overview", label: "Overview" },
          { key: "instagram", label: "Instagram", icon: Instagram },
          { key: "youtube", label: "YouTube", icon: Youtube },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setPlatformTab(key as PlatformTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              platformTab === key ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>

      {platformTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bento-card p-4 text-center">
              <p className="result-numeral text-xl">₹{stats.earnings.toLocaleString("en-IN")}</p>
              <p className="text-xs text-chalk-dim mt-1">Total Earned</p>
            </div>
            {deep && (
              <div className="bento-card p-4 text-center">
                <p className="result-numeral text-xl">{deep.completionRate}%</p>
                <p className="text-xs text-chalk-dim mt-1">Completion Rate</p>
              </div>
            )}
          </div>

          {deep?.avgRating && (
            <div className="bento-card p-4 flex items-center gap-3">
              {deep.ratingCount >= 3 && deep.avgRating >= 4.0
                ? <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                : <Star className="w-5 h-5 text-gold flex-shrink-0" />}
              <div>
                <p className="font-bold text-xl text-chalk">{Number(deep.avgRating).toFixed(1)}</p>
                <p className="text-xs text-chalk-dim">{deep.ratingCount} rating{deep.ratingCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}

          <div className="bento-card p-4">
            <p className="text-xs text-chalk-dim mb-3">Monthly Earnings (last 6 months)</p>
            <EarningsChart />
          </div>
        </>
      )}

      {platformTab === "instagram" && <PlatformAnalyticsTab platform="instagram" status={platforms?.instagram} />}
      {platformTab === "youtube"   && <PlatformAnalyticsTab platform="youtube"   status={platforms?.youtube} />}
    </div>
  );
}
