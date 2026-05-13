import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { PlatformHistoryPoint } from '@/lib/api';

interface Props {
  history: PlatformHistoryPoint[];
}

export function FollowerTrendChart({ history }: Props) {
  const [range, setRange] = useState<30 | 90>(30);
  const cutoff = new Date(Date.now() - range * 86400_000).toISOString().slice(0, 10);
  const data = history
    .filter((p) => p.captured_at >= cutoff)
    .map((p) => ({ date: p.captured_at.slice(5), followers: p.followers ?? 0 }));

  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-chalk mb-1">Follower Trend</p>
        <p className="text-xs text-chalk-dim">Trend data builds up over time — check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-chalk">Follower Trend</p>
        <div className="flex gap-1 rounded-md border border-white/10 p-0.5">
          {[30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 30 | 90)}
              className={`text-[10px] px-2 py-1 rounded ${range === r ? 'bg-purple-600 text-white' : 'text-chalk-dim hover:text-chalk'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} width={36} />
          <Tooltip
            contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e5e5' }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(v: number) => v.toLocaleString('en-IN')}
          />
          <Line type="monotone" dataKey="followers" stroke="#a855f7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
