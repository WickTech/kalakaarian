import { useState } from 'react';
import { Instagram, Youtube, RefreshCw, Loader2, Unlink, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { api, ConnectedPlatform, PlatformKind } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSync, usePlatformDisconnect } from '@/hooks/usePlatformSync';

interface Props {
  platform: PlatformKind;
  status: ConnectedPlatform | undefined;
}

const META: Record<PlatformKind, { label: string; Icon: typeof Instagram; gradient: string }> = {
  instagram: { label: 'Instagram', Icon: Instagram, gradient: 'from-pink-500 to-purple-500' },
  youtube:   { label: 'YouTube',   Icon: Youtube,   gradient: 'from-red-500 to-rose-500' },
};

export function PlatformConnectCard({ platform, status }: Props) {
  const { toast } = useToast();
  const { Icon, label, gradient } = META[platform];
  const [connecting, setConnecting] = useState(false);
  const syncMut = usePlatformSync();
  const disconnectMut = usePlatformDisconnect();

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { url } = await api.getPlatformAuthUrl(platform);
      window.location.href = url;
    } catch {
      toast({ title: `Failed to start ${label} connection`, variant: 'destructive' });
      setConnecting(false);
    }
  };

  if (!status?.connected) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-chalk">{label}</p>
            <p className="text-xs text-chalk-dim">Connect for real audience analytics</p>
          </div>
        </div>
        <Button onClick={handleConnect} disabled={connecting} size="sm" className="shrink-0">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Connect ${label}`}
        </Button>
      </div>
    );
  }

  const isExpired = status.lastSyncStatus === 'token_expired';
  const lastSync = status.lastSyncedAt ? formatDistanceToNow(new Date(status.lastSyncedAt), { addSuffix: true }) : 'never';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-chalk truncate">
                {status.username ?? label}
              </p>
              {status.profileUrl && (
                <a href={status.profileUrl} target="_blank" rel="noreferrer" className="text-chalk-dim hover:text-chalk shrink-0">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-chalk-dim">
              {isExpired ? <span className="text-amber-400 font-medium">Token expired — reconnect</span> : `Last synced ${lastSync}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isExpired ? (
            <Button onClick={handleConnect} size="sm" variant="default">
              Reconnect
            </Button>
          ) : (
            <Button
              onClick={() => syncMut.mutate(platform)}
              disabled={syncMut.isPending}
              size="sm"
              variant="outline"
              className="border-white/10"
            >
              {syncMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
              Refresh
            </Button>
          )}
          <Button
            onClick={() => { if (confirm(`Disconnect ${label}?`)) disconnectMut.mutate(platform); }}
            size="sm"
            variant="ghost"
            className="text-chalk-dim hover:text-red-400"
            title={`Disconnect ${label}`}
          >
            <Unlink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
