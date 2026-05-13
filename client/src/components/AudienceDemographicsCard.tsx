import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  genderAge: Record<string, number> | null;
  country: Record<string, number> | null;
}

const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

function aggregateGender(genderAge: Record<string, number>): Array<{ name: string; value: number }> {
  const acc: Record<string, number> = {};
  for (const [bucket, share] of Object.entries(genderAge)) {
    const gender = bucket.split('.')[0] || 'unknown';
    acc[gender] = (acc[gender] ?? 0) + share;
  }
  const label: Record<string, string> = { M: 'Men', F: 'Women', U: 'Other', male: 'Men', female: 'Women' };
  return Object.entries(acc).map(([k, v]) => ({ name: label[k] ?? k, value: Number((v * 100).toFixed(1)) }));
}

export function AudienceDemographicsCard({ genderAge, country }: Props) {
  if (!genderAge && !country) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-chalk mb-2">Audience Demographics</p>
        <p className="text-xs text-chalk-dim">No demographic data yet. Refresh or reconnect with broader scopes.</p>
      </div>
    );
  }

  const gender = genderAge ? aggregateGender(genderAge) : [];
  const topCountries = country
    ? Object.entries(country).sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([k, v]) => ({ code: k, share: Number((v * 100).toFixed(1)) }))
    : [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-xs text-chalk-dim uppercase tracking-wide mb-2">Gender Split</p>
        {gender.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={gender} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {gender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e5e5' }} formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-chalk-dim">Not available</p>}
        {gender.length > 0 && (
          <div className="flex justify-center gap-3 mt-2 flex-wrap">
            {gender.map((g, i) => (
              <div key={g.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-chalk-dim">{g.name}</span>
                <span className="text-chalk font-medium">{g.value}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-chalk-dim uppercase tracking-wide mb-2">Top Countries</p>
        {topCountries.length > 0 ? (
          <div className="space-y-1.5">
            {topCountries.map((c) => (
              <div key={c.code} className="flex items-center gap-2">
                <span className="text-xs font-medium text-chalk w-10">{c.code}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${c.share}%` }} />
                </div>
                <span className="text-[11px] text-chalk-dim w-12 text-right">{c.share}%</span>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-chalk-dim">Not available</p>}
      </div>
    </div>
  );
}
