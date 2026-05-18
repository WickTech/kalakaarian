import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Settings, Wallet, BarChart2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isOnline: boolean;
  onlineSince?: string | null;
  lastSeenAt?: string | null;
  onOpenWallet: () => void;
  onScrollAnalytics: () => void;
}

function fmtRelative(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function OwnerActionsBar({
  isOnline: initialOnline,
  onlineSince: initialOnlineSince,
  lastSeenAt: initialLastSeenAt,
  onOpenWallet,
  onScrollAnalytics,
}: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [, setOnlineSince] = useState<string | null>(initialOnlineSince ?? null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(initialLastSeenAt ?? null);
  const [toggling, setToggling] = useState(false);
  const [, forceTick] = useState(0);

  // Sync from parent when cached profile data arrives/changes (e.g. after navigation)
  useEffect(() => {
    setIsOnline(initialOnline);
  }, [initialOnline]);

  // Re-render every 30s while offline so the "Offline Xm ago" string stays accurate.
  useEffect(() => {
    if (isOnline) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [isOnline]);

  const togglePresence = async () => {
    if (toggling) return;
    const next = !isOnline;
    const now = new Date().toISOString();
    setIsOnline(next);
    if (next) { setOnlineSince(now); setLastSeenAt(null); }
    else { setLastSeenAt(now); setOnlineSince(null); }
    setToggling(true);
    try {
      await api.updatePresence(next);
      // Update cached profile so state survives navigation
      const patch = next
        ? { isOnline: true, onlineSince: now, lastSeenAt: null }
        : { isOnline: false, onlineSince: null, lastSeenAt: now };
      qc.setQueryData(['influencer-profile', user?.id], (old: unknown) => old && typeof old === 'object' ? { ...old, ...patch } : old);
      qc.setQueryData(['influencer-profile-own'], (old: unknown) => old && typeof old === 'object' ? { ...old, ...patch } : old);
    } catch {
      setIsOnline(!next);
      if (!next) { setOnlineSince(now); setLastSeenAt(null); }
      else { setLastSeenAt(now); setOnlineSince(null); }
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={togglePresence}
        disabled={toggling}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
          toggling ? "opacity-50 cursor-not-allowed" : ""
        } ${
          isOnline
            ? "border-green-500/40 bg-green-500/10 text-green-300"
            : "border-white/10 bg-white/5 text-chalk-dim"
        }`}
        title={isOnline ? "Go offline" : "Go online"}
      >
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-chalk-faint"}`} />
        {isOnline
          ? "Active"
          : <>Offline <span className="text-[10px] text-chalk-faint">{fmtRelative(lastSeenAt)}</span></>}
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <Link
          to="/account/personal"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-chalk-dim hover:text-chalk hover:border-white/20 transition-all"
          title="Edit profile"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Link>
        <Link
          to="/account"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-chalk-dim hover:text-chalk hover:border-white/20 transition-all"
          title="Account"
        >
          <Settings className="w-3.5 h-3.5" /> Account
        </Link>
        <button
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-chalk-dim hover:text-chalk hover:border-white/20 transition-all"
          title="Wallet"
        >
          <Wallet className="w-3.5 h-3.5 text-gold" /> Wallet
        </button>
        <button
          onClick={onScrollAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-chalk-dim hover:text-chalk hover:border-white/20 transition-all"
          title="Analytics"
        >
          <BarChart2 className="w-3.5 h-3.5" /> Analytics
        </button>
      </div>
    </div>
  );
}
