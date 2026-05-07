import { Star, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Props {
  influencerId: string;
  avgRating?: number | null;
  ratingCount?: number;
}

export function InfluencerTrustSection({ influencerId, avgRating, ratingCount = 0 }: Props) {
  const { data } = useQuery({
    queryKey: ['influencer-ratings', influencerId],
    queryFn: () => api.getInfluencerRatings(influencerId),
    staleTime: 60_000,
    enabled: ratingCount > 0,
  });

  const avg = avgRating ?? data?.avg ?? null;
  const count = ratingCount || data?.count || 0;
  const reviews = data?.ratings ?? [];
  const trusted = avg !== null && avg >= 4.0 && count >= 3;

  if (count === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Ratings & Reviews</h2>
        {trusted && (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Trusted Creator
          </span>
        )}
      </div>

      <div className="border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold">{avg?.toFixed(1)}</span>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${avg && n <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {count} brand review{count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="border-t border-border pt-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3 h-3 ${n <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.review && (
                  <p className="text-sm text-muted-foreground italic">"{r.review}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
