import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageSquare, FileText, DollarSign, Info, X } from "lucide-react";
import { api, AppNotification } from "@/lib/api";

const TYPE_ICONS: Record<string, React.ElementType> = {
  proposal: MessageSquare,
  campaign: FileText,
  message: MessageSquare,
  payment: DollarSign,
  system: Info,
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  useEffect(() => { document.title = "Notifications | Kalakaarian"; }, []);

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h1 className="font-semibold text-lg">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAll.mutate()} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Bell className="w-10 h-10 opacity-20" />
            <p className="text-sm">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayed.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Info;
              return (
                <div key={n.id}
                  onClick={() => { if (n.link) navigate(n.link); if (!n.read) markRead.mutate(n.id); }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-secondary/50 ${!n.read ? "border-primary/20 bg-primary/5" : "border-border"}`}
                >
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    <button onClick={(e) => { e.stopPropagation(); del.mutate(n.id); }}
                      className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
