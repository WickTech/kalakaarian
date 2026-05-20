import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, ShieldCheck, Plug, Lock, CreditCard, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SectionHeader } from './components/SectionHeader';
import { keys } from '@/lib/queryKeys';

const QUICK_LINKS = [
  { to: '/account/personal',     label: 'Personal Info',          sub: 'Name, bio, location',        icon: User },
  { to: '/account/security',     label: 'Security & Sign-in',     sub: 'Password, sign-out',          icon: ShieldCheck },
  { to: '/account/privacy',      label: 'Data & Privacy',         sub: 'Visibility, discoverability', icon: Lock },
  { to: '/account/payments',     label: 'Payments & Subscriptions', sub: 'Wallet, transactions',      icon: CreditCard },
];

export default function AccountHome() {
  const { user } = useAuth();
  useEffect(() => { document.title = 'Account — Kalakaarian'; }, []);

  const isCreator = user?.role === 'influencer';

  const { data: profile } = useQuery({
    queryKey: isCreator ? keys.creators.profileOwn() : keys.brand.profile(),
    queryFn: () => isCreator ? api.getInfluencerProfile() : api.getBrandSettings(),
    staleTime: 5 * 60_000,
  });

  const { data: platforms } = useQuery({
    queryKey: keys.platforms.connected(),
    queryFn: () => api.getConnectedPlatforms(),
    enabled: isCreator,
    staleTime: 5 * 60_000,
  });

  const pUnknown = profile as unknown as Record<string, unknown>;
  const displayName = isCreator
    ? (pUnknown?.name as string | undefined) ?? user?.name
    : ((pUnknown?.profile as Record<string, unknown>)?.companyName as string | undefined) ?? user?.name;

  const avatarUrl = isCreator
    ? (pUnknown?.profileImage as string | undefined)
    : ((pUnknown?.profile as Record<string, unknown>)?.logo_url as string | undefined)
      ?? ((pUnknown?.profile as Record<string, unknown>)?.logo as string | undefined);

  const initials = (displayName ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const connectedCount = platforms
    ? Object.values(platforms).filter((p) => (p as { connected?: boolean })?.connected).length
    : 0;

  const links = isCreator
    ? [...QUICK_LINKS.slice(0, 2), { to: '/account/integrations', label: 'Connected Apps', sub: 'Instagram, YouTube', icon: Plug }, ...QUICK_LINKS.slice(2)]
    : QUICK_LINKS;

  return (
    <div className="space-y-6">
      <SectionHeader title="Account Home" subtitle="Overview of your account" />

      {/* Profile summary card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl border border-white/15 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            : <span className="text-lg font-bold text-chalk-dim">{initials}</span>}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-chalk truncate">{displayName ?? '—'}</p>
          <p className="text-xs text-chalk-dim mt-0.5">
            {isCreator ? 'Creator' : 'Brand'} · {user?.email ?? '—'}
          </p>
          {isCreator && connectedCount > 0 && (
            <p className="text-xs text-purple-400 mt-0.5">{connectedCount} platform{connectedCount !== 1 ? 's' : ''} connected</p>
          )}
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map(({ to, label, sub, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
              <Icon className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-chalk">{label}</p>
              <p className="text-xs text-chalk-dim">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-chalk-faint group-hover:text-chalk-dim transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
