import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Flag { key: string; enabled: boolean; description: string; updated_at: string }

interface Props {
  flags: Flag[];
  onRefresh: () => void;
}

export function AdminFlagsPanel({ flags, onRefresh }: Props) {
  const { toast } = useToast();

  const toggle = async (key: string, current: boolean) => {
    try {
      await api.adminUpdateFeatureFlag(key, !current);
      toast({ title: `${key} ${!current ? "enabled" : "disabled"}` });
      onRefresh();
    } catch {
      toast({ title: "Failed to update flag", variant: "destructive" });
    }
  };

  const FLAG_ICONS: Record<string, string> = {
    maintenance_mode: "🚧",
    new_registrations: "📝",
    marketplace_visible: "🏪",
    campaign_creation: "📣",
    creator_registrations: "🎨",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-chalk-faint">Toggle platform feature flags. Changes take effect immediately.</p>
      {flags.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-xl">{FLAG_ICONS[f.key] ?? "🔧"}</span>
            <div>
              <p className="text-sm font-medium text-chalk">{f.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
              <p className="text-xs text-chalk-faint">{f.description}</p>
            </div>
          </div>
          <button
            onClick={() => toggle(f.key, f.enabled)}
            className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${f.enabled ? "bg-green-500" : "bg-white/10"}`}
            role="switch" aria-checked={f.enabled}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${f.enabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      ))}
      {flags.length === 0 && <p className="text-center text-xs text-chalk-faint py-8">No feature flags found</p>}
    </div>
  );
}
