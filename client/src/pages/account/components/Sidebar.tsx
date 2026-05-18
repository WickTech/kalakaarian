import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, User, ShieldCheck, Plug, Lock, CreditCard,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ALL_ITEMS = [
  { to: '/account',              label: 'Home',                   icon: LayoutDashboard, exact: true },
  { to: '/account/personal',     label: 'Personal Info',          icon: User },
  { to: '/account/security',     label: 'Security & Sign-in',     icon: ShieldCheck },
  { to: '/account/integrations', label: 'Connected Apps',         icon: Plug,   creatorOnly: true },
  { to: '/account/privacy',      label: 'Data & Privacy',         icon: Lock },
  { to: '/account/payments',     label: 'Payments & Subscriptions', icon: CreditCard },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isSuperAdmin, viewAs } = useAuth();
  const role = isSuperAdmin ? (viewAs ?? user?.role) : user?.role;

  const items = ALL_ITEMS.filter((item) => {
    if (item.creatorOnly && role !== 'influencer') return false;
    return true;
  });

  return (
    <nav className="space-y-0.5">
      {items.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive
                ? 'bg-purple-600/15 text-purple-300 font-medium border border-purple-500/20'
                : 'text-chalk-dim hover:text-chalk hover:bg-white/5'
            }`
          }
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
