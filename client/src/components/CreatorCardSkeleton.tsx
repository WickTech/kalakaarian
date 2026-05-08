export function CreatorCardSkeleton() {
  return (
    <div className="creator-card p-3 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3.5 bg-white/5 rounded-full w-3/4" />
          <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-white/5 rounded-full" />
        <div className="h-5 w-12 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bento-card-dark p-2 rounded-lg space-y-1">
            <div className="h-2 bg-white/5 rounded-full w-full" />
            <div className="h-3 bg-white/5 rounded-full w-2/3 mx-auto" />
          </div>
        ))}
      </div>
      <div className="h-7 bg-white/5 rounded-full w-full" />
    </div>
  );
}
