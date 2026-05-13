import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface Props {
  score: number | null;
  size?: 'sm' | 'md';
}

export function AuthenticityScoreBadge({ score, size = 'md' }: Props) {
  if (score == null) return null;

  const tone = score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low';
  const styles = {
    good: { color: 'text-emerald-300', border: 'border-emerald-400/40', bg: 'bg-emerald-500/10', Icon: ShieldCheck, label: 'Authentic audience' },
    mid:  { color: 'text-amber-300',   border: 'border-amber-400/40',   bg: 'bg-amber-500/10',   Icon: Shield,      label: 'Mixed signals' },
    low:  { color: 'text-red-300',     border: 'border-red-400/40',     bg: 'bg-red-500/10',     Icon: ShieldAlert, label: 'Signals suggest review' },
  }[tone];

  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div
      title={`${styles.label}. Score derived from reach, engagement, audience country diversity, and demographic data completeness.`}
      className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${styles.bg} ${styles.border}`}
    >
      <styles.Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${styles.color}`} />
      <span className={`${text} font-semibold ${styles.color}`}>Authenticity {score}/100</span>
    </div>
  );
}
