import { useEffect, useState, useCallback } from "react";
import { Users, Megaphone, BarChart2, ToggleLeft, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { AdminFlagsPanel } from "@/components/admin/AdminFlagsPanel";

type Tab = "overview" | "users" | "campaigns" | "flags" | "audit";

interface Stats { totalUsers: number; totalCreators: number; totalBrands: number; totalCampaigns: number; verifiedCreators: number; suspendedUsers: number; }
interface AdminUser { id: string; name: string; email: string; role: string; is_super_admin: boolean; is_suspended: boolean; created_at: string; }
interface Campaign { id: string; title: string; status: string; brand_id: string; created_at: string; }
interface Flag { key: string; enabled: boolean; description: string; updated_at: string; }
interface AuditLog { id: string; admin_id: string; action: string; target_type: string; target_id: string; details: object; created_at: string; profiles: { name: string; email: string }; }

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, c, f, a] = await Promise.all([
        api.adminGetStats(),
        api.adminGetUsers(),
        api.adminGetCampaigns(),
        api.adminGetFeatureFlags(),
        api.adminGetAuditLogs(),
      ]);
      setStats(s);
      setUsers(u.users ?? []);
      setCampaigns(c.campaigns ?? []);
      setFlags(f.flags ?? []);
      setAuditLogs(a.logs ?? []);
    } catch { /* 403 caught by AdminRoute */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { key: "overview" as Tab, label: "Overview", Icon: BarChart2 },
    { key: "users" as Tab, label: "Users", Icon: Users },
    { key: "campaigns" as Tab, label: "Campaigns", Icon: Megaphone },
    { key: "flags" as Tab, label: "Feature Flags", Icon: ToggleLeft },
    { key: "audit" as Tab, label: "Audit Log", Icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-obsidian py-8 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-gold/20 text-gold font-bold uppercase tracking-wide">Founder</span>
              <span className="text-xs text-chalk-faint">{user?.email}</span>
            </div>
            <h1 className="text-2xl font-bold text-chalk">Admin Dashboard</h1>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/10 text-chalk-dim hover:text-chalk transition-colors disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all ${tab === key ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-white/10 text-chalk-dim hover:text-chalk"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
        ) : (
          <>
            {tab === "overview" && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Total Users", value: stats.totalUsers, color: "text-chalk" },
                  { label: "Creators", value: stats.totalCreators, color: "text-purple-300" },
                  { label: "Brands", value: stats.totalBrands, color: "text-blue-300" },
                  { label: "Campaigns", value: stats.totalCampaigns, color: "text-gold" },
                  { label: "Verified Creators", value: stats.verifiedCreators, color: "text-green-400" },
                  { label: "Suspended", value: stats.suspendedUsers, color: "text-red-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-5 space-y-1">
                    <p className="text-xs text-chalk-faint">{label}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "users" && <AdminUsersPanel users={users} onRefresh={load} />}
            {tab === "campaigns" && (
              <div className="space-y-1.5">
                {campaigns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div>
                      <p className="text-sm text-chalk">{c.title}</p>
                      <p className="text-xs text-chalk-faint">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <select value={c.status}
                      onChange={(e) => api.adminUpdateCampaignStatus(c.id, e.target.value).then(load)}
                      className="bg-charcoal/50 border border-white/10 rounded-full px-2 py-1 text-xs text-chalk-dim focus:outline-none">
                      {["open", "closed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
                {campaigns.length === 0 && <p className="text-center text-xs text-chalk-faint py-8">No campaigns</p>}
              </div>
            )}
            {tab === "flags" && <AdminFlagsPanel flags={flags} onRefresh={load} />}
            {tab === "audit" && (
              <div className="space-y-1.5">
                {auditLogs.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-chalk font-mono">{l.action}</p>
                      <p className="text-xs text-chalk-faint">
                        by {l.profiles?.name ?? l.admin_id} · {l.target_type} {l.target_id}
                      </p>
                    </div>
                    <span className="text-xs text-chalk-faint shrink-0">{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-center text-xs text-chalk-faint py-8">No audit log entries yet</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
