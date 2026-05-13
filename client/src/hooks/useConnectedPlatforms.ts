import { useQuery } from '@tanstack/react-query';
import { api, ConnectedPlatformsMap, PlatformKind, PlatformMetricsResponse } from '@/lib/api';

export function useConnectedPlatforms() {
  return useQuery<ConnectedPlatformsMap>({
    queryKey: ['connected-platforms'],
    queryFn: () => api.getConnectedPlatforms(),
    staleTime: 60_000,
  });
}

export function usePlatformMetrics(platform: PlatformKind, enabled = true) {
  return useQuery<PlatformMetricsResponse>({
    queryKey: ['platform-metrics', platform],
    queryFn: () => api.getPlatformMetrics(platform),
    enabled,
    staleTime: 60_000,
  });
}
