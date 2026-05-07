import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function BadgeStrip({ influencerId }: { influencerId: string }) {
  const { data } = useQuery({
    queryKey: ["public-badges", influencerId],
    queryFn: () => api.getPublicBadges(influencerId),
    staleTime: 5 * 60_000,
  });

  if (!data?.badges?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {data.badges.map((b: any) => (
        <span key={b.id} title={b.description}
          className="text-xs px-2 py-1 rounded-full border border-white/10 text-chalk-dim flex items-center gap-1.5">
          <span>{b.emoji}</span> {b.name}
        </span>
      ))}
    </div>
  );
}
