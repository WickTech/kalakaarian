import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { ArrowLeft, Users, Megaphone } from "lucide-react";

interface AdminUser { id: string; name: string; email: string; role: string; created_at: string; }
interface AdminCampaign { id: string; title: string; status: string; brand_id: string; created_at: string; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"users" | "campaigns">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) { navigate("/"); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const [u, c] = await Promise.all([
        api.adminGetUsers(),
        api.adminGetCampaigns(),
      ]);
      setUsers(u.users ?? []);
      setCampaigns(c.campaigns ?? []);
    } catch { /* non-admin will get 403 and be redirected */ }
    finally { setLoading(false); }
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    await api.adminUpdateCampaignStatus(id, status);
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-border hover:border-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-foreground">Admin Dashboard</span>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([["users", Users, "Users"], ["campaigns", Megaphone, "Campaigns"]] as const).map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : tab === "users" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">{users.length} total users</p>
            {users.map((u) => (
              <div key={u.id} className="border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === "brand" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                  {u.role?.toUpperCase() || "—"}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {new Date(u.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">{campaigns.length} total campaigns</p>
            {campaigns.map((c) => (
              <div key={c.id} className="border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <select
                  value={c.status}
                  onChange={(e) => updateCampaignStatus(c.id, e.target.value)}
                  className="text-xs border border-border rounded-md px-2 py-1 bg-card focus:outline-none focus:border-primary"
                >
                  {["open", "closed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
