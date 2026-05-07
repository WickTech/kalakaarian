import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const BADGE_COLORS: Record<string, string> = {
  rising_star: "text-gold",
  power_performer: "text-purple-400",
  campaign_champion: "text-green-400",
  trusted_creator: "text-blue-400",
  top_rated: "text-pink-400",
};

const LEVEL_COLORS: Record<string, string> = {
  Bronze: "text-amber-600 border-amber-600/30 bg-amber-600/10",
  Silver: "text-slate-400 border-slate-400/30 bg-slate-400/10",
  Gold: "text-gold border-gold/30 bg-gold/10",
  Platinum: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

export function GamificationPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["gamification-influencer"],
    queryFn: () => api.getGamification(),
    staleTime: 2 * 60_000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return null;

  const progress = data.nextLevelXp
    ? Math.min(100, Math.round(data.xp / data.nextLevelXp * 100))
    : 100;

  return (
    <div className="space-y-5">
      <div className="bento-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-chalk">Your Progress</h2>
            <p className="text-chalk-dim text-sm mt-0.5">{data.xp} XP earned</p>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${LEVEL_COLORS[data.level] || ""}`}>
            {data.level}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-gold transition-all duration-700"
            style={{ width: `${progress}%` }} />
        </div>
        {data.nextLevelXp && (
          <p className="text-xs text-chalk-faint mt-2 text-right">{data.nextLevelXp - data.xp} XP to next level</p>
        )}
      </div>

      <div className="bento-card p-5">
        <h2 className="font-display font-bold text-chalk mb-4">Badges</h2>
        <div className="grid grid-cols-1 gap-3">
          {data.badges.map(b => (
            <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              b.earned ? "border-white/15 bg-white/3" : "border-white/5 opacity-40"
            }`}>
              <span className="text-2xl">{b.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${b.earned ? (BADGE_COLORS[b.id] || "text-chalk") : "text-chalk-dim"}`}>{b.name}</p>
                <p className="text-xs text-chalk-faint">{b.description}</p>
              </div>
              {b.earned && <span className="text-xs text-green-400 flex-shrink-0">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bento-card p-4 bg-purple-500/5 border border-purple-500/20">
        <h3 className="text-xs font-semibold text-chalk mb-2">How to Earn XP</h3>
        <ul className="space-y-1 text-xs text-chalk-dim">
          {[["10 XP", "per accepted proposal"], ["20 XP", "per completed campaign"], ["15 XP", "per review received"], ["10 XP", "bonus per 5★ review"]].map(([pts, desc]) => (
            <li key={pts} className="flex items-center gap-2">
              <span className="text-purple-400 font-mono w-10">{pts}</span>{desc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
