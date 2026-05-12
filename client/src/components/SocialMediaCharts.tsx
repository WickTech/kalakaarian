import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface IgStats { followers: number; following: number; posts: number; engagementRate?: number; }

const GENDER_DATA = [
  { name: "Men",      value: 44, color: "#7c3aed" },
  { name: "Women",    value: 40, color: "#ec4899" },
  { name: "Others",   value: 11, color: "#f59e0b" },
  { name: "Est. Bots",value: 5,  color: "#4b5563" },
];

function buildPerfData(ig: IgStats) {
  const base = Math.max(ig.followers * ((ig.engagementRate ?? 3) / 100), 100);
  const r = (m: number) => Math.round(base * m);
  return [
    { name: "Reel 1", likes: r(0.85), comments: r(0.07), shares: r(0.18) },
    { name: "Reel 2", likes: r(0.72), comments: r(0.05), shares: r(0.12) },
    { name: "Reel 3", likes: r(1.10), comments: r(0.09), shares: r(0.22) },
    { name: "Post 1", likes: r(0.60), comments: r(0.04), shares: r(0.08) },
    { name: "Post 2", likes: r(0.48), comments: r(0.03), shares: r(0.06) },
  ];
}

const fmtNum = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`);

const ttStyle = {
  background: "#14141e",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 11,
};

export function PerformanceBarChart({ ig, isMock }: { ig: IgStats; isMock?: boolean }) {
  const data = buildPerfData(ig);
  return (
    <div className="bento-card p-4">
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs font-semibold text-chalk">Reel & Post Performance</p>
        {isMock && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-chalk-faint">Sample data</span>}
      </div>
      <p className="text-[10px] text-chalk-faint mb-3 mt-0.5">Estimated from engagement data</p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} barCategoryGap="22%" margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number, name: string) => [fmtNum(v), name.charAt(0).toUpperCase() + name.slice(1)]}
            contentStyle={ttStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="likes"    fill="#7c3aed" radius={[3,3,0,0]} maxBarSize={16} />
          <Bar dataKey="comments" fill="#ec4899" radius={[3,3,0,0]} maxBarSize={16} />
          <Bar dataKey="shares"   fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2">
        {([ ["#7c3aed","Likes"], ["#ec4899","Comments"], ["#f59e0b","Shares"] ] as const).map(([c,l]) => (
          <span key={l} className="flex items-center gap-1 text-[10px] text-chalk-dim">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
interface PieLabelProps { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; }
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) {
  if (percent < 0.08) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function GenderPieChart() {
  return (
    <div className="bento-card p-4">
      <p className="text-xs font-semibold text-chalk">Audience Gender Split</p>
      <p className="text-[10px] text-chalk-faint mb-3 mt-0.5">Estimated audience demographics</p>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <PieChart width={140} height={140}>
          <Pie
            data={GENDER_DATA}
            cx={70} cy={70}
            innerRadius={38} outerRadius={62}
            dataKey="value"
            labelLine={false}
            label={PieLabel}
          >
            {GENDER_DATA.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
          </Pie>
        </PieChart>
        <div className="flex flex-col gap-2.5">
          {GENDER_DATA.map(({ name, value, color }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[11px] text-chalk-dim w-16">{name}</span>
              <span className="text-[11px] font-bold text-chalk">{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
