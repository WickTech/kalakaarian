import { useQuery } from '@tanstack/react-query';
import { api, ConnectedPlatformsMap, PlatformKind, PlatformMetricsResponse } from '@/lib/api';
import { keys } from '@/lib/queryKeys';

export function useConnectedPlatforms() {
  return useQuery<ConnectedPlatformsMap>({
    queryKey: keys.platforms.connected(),
    queryFn: () => api.getConnectedPlatforms(),
    staleTime: 60_000,
  });
}

export function usePlatformMetrics(platform: PlatformKind, enabled = true) {
  return useQuery<PlatformMetricsResponse>({
    queryKey: keys.platforms.metrics(platform),
    queryFn: () => api.getPlatformMetrics(platform),
    enabled,
    staleTime: 60_000,
  });
}
