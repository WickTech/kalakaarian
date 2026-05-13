export function CreatorCardSkeleton() {
  return (
    <div className="creator-card p-3">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 skeleton-shimmer shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-1">
            <div className="h-3.5 skeleton-shimmer w-2/3" />
            <div className="h-3.5 skeleton-shimmer w-8 shrink-0" />
          </div>
          <div className="h-2.5 skeleton-shimmer w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 skeleton-shimmer" />
        <div className="h-5 w-12 skeleton-shimmer" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bento-card-dark p-2 rounded-lg space-y-1">
            <div className="h-2 skeleton-shimmer w-full" />
            <div className="h-3 skeleton-shimmer w-2/3 mx-auto" />
          </div>
        ))}
      </div>
      <div className="h-7 skeleton-shimmer w-full" />
    </div>
  );
}
