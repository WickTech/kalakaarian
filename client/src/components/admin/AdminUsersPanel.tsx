import { useState } from "react";
import { Search, ShieldCheck, ShieldOff, Trash2, Wifi, WifiOff, UserCheck, UserX } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string; name: string; email: string; role: string;
  is_super_admin: boolean; is_suspended: boolean; created_at: string;
}

interface Props {
  users: AdminUser[];
  onRefresh: () => void;
}

export function AdminUsersPanel({ users, onRefresh }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "brand" | "influencer">("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const act = async (label: string, fn: () => Promise<{ message: string }>, id: string) => {
    setLoading(id + label);
    try {
      const res = await fn();
      toast({ title: res.message });
      onRefresh();
    } catch {
      toast({ title: `${label} failed`, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full bg-charcoal/50 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-chalk focus:outline-none focus:border-purple-500/50" />
        </div>
        {(["all", "brand", "influencer"] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${roleFilter === r ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim"}`}>
            {r === "all" ? "All" : r === "brand" ? "Brands" : "Creators"}
          </button>
        ))}
        <span className="text-xs text-chalk-faint ml-auto">{filtered.length} users</span>
      </div>

      <div className="space-y-1.5">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
              {(u.name || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-chalk truncate">{u.name || "—"}</span>
                {u.is_super_admin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-bold">Founder</span>}
                {u.is_suspended && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">Suspended</span>}
              </div>
              <p className="text-xs text-chalk-faint truncate">{u.email} · <span className="capitalize">{u.role}</span></p>
            </div>
            {!u.is_super_admin && (
              <div className="flex items-center gap-1 shrink-0">
                {u.role === "influencer" && (
                  <>
                    <button title="Force online" disabled={!!loading} onClick={() => act("presence", () => api.adminForcePresence(u.id, true), u.id)}
                      className="p-1.5 rounded-lg text-chalk-faint hover:text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-40">
                      <Wifi className="w-3.5 h-3.5" />
                    </button>
                    <button title="Force offline" disabled={!!loading} onClick={() => act("presence", () => api.adminForcePresence(u.id, false), u.id)}
                      className="p-1.5 rounded-lg text-chalk-faint hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                      <WifiOff className="w-3.5 h-3.5" />
                    </button>
                    <button title="Verify creator" disabled={!!loading} onClick={() => act("verify", () => api.adminVerifyCreator(u.id, true), u.id)}
                      className="p-1.5 rounded-lg text-chalk-faint hover:text-blue-400 hover:bg-blue-400/10 transition-colors disabled:opacity-40">
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button title={u.is_suspended ? "Unsuspend" : "Suspend"} disabled={!!loading}
                  onClick={() => act("suspend", () => api.adminSuspendUser(u.id, !u.is_suspended), u.id)}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${u.is_suspended ? "text-green-400 hover:bg-green-400/10" : "text-chalk-faint hover:text-yellow-400 hover:bg-yellow-400/10"}`}>
                  {u.is_suspended ? <UserX className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                </button>
                <button title="Delete user" disabled={!!loading}
                  onClick={() => { if (confirm(`Delete ${u.name}? This cannot be undone.`)) act("delete", () => api.adminDeleteUser(u.id), u.id); }}
                  className="p-1.5 rounded-lg text-chalk-faint hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {u.is_super_admin && <ShieldCheck className="w-4 h-4 text-gold shrink-0" />}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs text-chalk-faint py-8">No users match filters</p>}
      </div>
    </div>
  );
}
