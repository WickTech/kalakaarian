import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, PlatformKind } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { keys } from '@/lib/queryKeys';

export function usePlatformSync() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (platform: PlatformKind) => api.syncPlatform(platform),
    onSuccess: (_, platform) => {
      toast({ title: `${platform === 'instagram' ? 'Instagram' : 'YouTube'} synced` });
      qc.invalidateQueries({ queryKey: keys.platforms.metrics(platform) });
      qc.invalidateQueries({ queryKey: keys.platforms.connected() });
    },
    onError: () => {
      toast({ title: 'Sync failed', description: 'Try reconnecting the account.', variant: 'destructive' });
    },
  });
}

export function usePlatformDisconnect() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (platform: PlatformKind) => api.disconnectPlatform(platform),
    onSuccess: (_, platform) => {
      toast({ title: `${platform === 'instagram' ? 'Instagram' : 'YouTube'} disconnected` });
      qc.invalidateQueries({ queryKey: keys.platforms.metrics(platform) });
      qc.invalidateQueries({ queryKey: keys.platforms.connected() });
    },
  });
}
