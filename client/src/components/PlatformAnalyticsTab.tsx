import { ConnectedPlatform, PlatformKind, PlatformMetrics } from '@/lib/api';
import { PlatformConnectCard } from './PlatformConnectCard';
import { AuthenticityScoreBadge } from './AuthenticityScoreBadge';
import { AudienceDemographicsCard } from './AudienceDemographicsCard';
import { FollowerTrendChart } from './FollowerTrendChart';
import { usePlatformMetrics } from '@/hooks/useConnectedPlatforms';

interface Props {
  platform: PlatformKind;
  status: ConnectedPlatform | undefined;
}

const LABELS: Record<PlatformKind, { followers: string; posts: string }> = {
  instagram: { followers: 'Followers', posts: 'Posts' },
  youtube:   { followers: 'Subscribers', posts: 'Videos' },
};

export function PlatformAnalyticsTab({ platform, status }: Props) {
  const { data, isLoading } = usePlatformMetrics(platform, !!status?.connected);
  const labels = LABELS[platform];

  return (
    <div className="space-y-4">
      <PlatformConnectCard platform={platform} status={status} />
      {status?.connected && data?.metrics ? (
        <MetricsView metrics={data.metrics} history={data.history} labels={labels} />
      ) : status?.connected && isLoading ? (
        <p className="text-xs text-chalk-dim text-center py-8">Loading metrics…</p>
      ) : status?.connected ? (
        <p className="text-xs text-chalk-dim text-center py-8">No data yet — click Refresh to fetch from {platform === 'instagram' ? 'Instagram' : 'YouTube'}.</p>
      ) : null}
    </div>
  );
}

function MetricsView({
  metrics,
  history,
  labels,
}: {
  metrics: PlatformMetrics;
  history: import('@/lib/api').PlatformHistoryPoint[];
  labels: { followers: string; posts: string };
}) {
  const cards = [
    { label: labels.followers, value: fmt(metrics.followers) },
    { label: labels.posts, value: fmt(metrics.posts_count) },
    { label: 'Reach (28d)', value: fmt(metrics.reach_28d) },
    { label: 'Engagement', value: metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : '—' },
  ];
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <AuthenticityScoreBadge score={metrics.authenticity_score} />
        <p className="text-[10px] text-chalk-dim uppercase tracking-wide">
          Updated {new Date(metrics.fetched_at).toLocaleString()}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-chalk">{c.value}</p>
            <p className="text-[10px] text-chalk-dim mt-0.5 uppercase tracking-wide">{c.label}</p>
          </div>
        ))}
      </div>
      <AudienceDemographicsCard genderAge={metrics.audience_gender_age} country={metrics.audience_country} />
      <FollowerTrendChart history={history} />
      {metrics.top_media && metrics.top_media.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-chalk mb-3">Top Content</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {metrics.top_media.map((m) => (
              <a key={m.id} href={m.url ?? '#'} target="_blank" rel="noreferrer" className="relative aspect-square rounded-lg overflow-hidden bg-white/5 group">
                {m.thumbnail ? (
                  <img src={m.thumbnail} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-chalk-dim text-xs">No image</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-chalk">
                  ❤ {fmt(m.likes)} · 💬 {fmt(m.comments)}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}
