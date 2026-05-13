import { TrendingUp, Eye, DollarSign, Users } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: 'er' | 'views' | 'cpv' | 'fake';
  trend?: { value: number; positive: boolean };
}

const iconMap = { er: TrendingUp, views: Eye, cpv: DollarSign, fake: Users };

const iconStyle = {
  er:    'text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/20',
  views: 'text-purple-400 bg-purple-500/10 ring-1 ring-purple-500/20',
  cpv:   'text-green-400 bg-green-500/10 ring-1 ring-green-500/20',
  fake:  'text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/20',
};

export function AnalyticsCard({ title, value, subtitle, icon, trend }: AnalyticsCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="metric-tile group">
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg transition-transform duration-300 group-hover:scale-105 ${iconStyle[icon]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            trend.positive
              ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20'
              : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
          }`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="stat-numeral text-2xl">{value}</p>
        <p className="text-[11px] tracking-wider uppercase text-chalk-faint mt-2">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-chalk-dim mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
