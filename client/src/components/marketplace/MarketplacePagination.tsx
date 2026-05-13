interface Props {
  page: number;
  totalPages: number;
  setPage: (updater: (p: number) => number) => void;
  goToPage: (n: number) => void;
}

export function MarketplacePagination({ page, totalPages, setPage, goToPage }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-chalk-dim disabled:opacity-40 hover:text-chalk transition-colors">← Prev</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => goToPage(p)}
          className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${p === page ? "bg-gold text-obsidian" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
          {p}
        </button>
      ))}
      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-chalk-dim disabled:opacity-40 hover:text-chalk transition-colors">Next →</button>
    </div>
  );
}
