import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { keys } from '@/lib/queryKeys';

interface BaseOptions {
  /** Disable subscription (e.g. while collapsed). */
  enabled?: boolean;
}

interface ByCampaignOptions extends BaseOptions {
  campaignId: string | undefined;
}

interface ByCreatorOptions extends BaseOptions {
  campaignCreatorId: string | undefined;
}

// Subscribes to campaign_creators + campaign_creator_activity_log changes
// for a single campaign and invalidates the matching query keys. Replaces
// refetchInterval polling for brand-side campaign tracking.
export function useRealtimeCampaignByCampaign({
  campaignId,
  enabled = true,
}: ByCampaignOptions): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !campaignId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase
      .channel(`campaign:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_creators',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: keys.campaignCreators.byCampaign(campaignId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignId, enabled, qc]);
}

// Subscribes to a single campaign_creators row + its activity log.
// Used by workflow detail / activity views.
export function useRealtimeCampaignCreator({
  campaignCreatorId,
  enabled = true,
}: ByCreatorOptions): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !campaignCreatorId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase
      .channel(`campaign-creator:${campaignCreatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_creators',
          filter: `id=eq.${campaignCreatorId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: keys.workflow.detail(campaignCreatorId) });
          qc.invalidateQueries({ queryKey: keys.workflow.public(campaignCreatorId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_creator_activity_log',
          filter: `campaign_creator_id=eq.${campaignCreatorId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: keys.workflow.activity(campaignCreatorId) });
          qc.invalidateQueries({ queryKey: keys.workflow.public(campaignCreatorId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignCreatorId, enabled, qc]);
}
