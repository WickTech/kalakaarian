import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

// Realtime subscriptions for messaging + notifications (Phase 4). Each hook
// takes a plain callback (the components hold raw state, not query keys) and
// keeps it in a ref so changing the callback never re-subscribes the channel.
//
// Requires migration 036 (publication + RLS). When VITE_SUPABASE_* is unset
// getSupabase() returns null and these hooks no-op — callers keep polling.

function useStableCallback(onChange: () => void): React.MutableRefObject<() => void> {
  const ref = useRef(onChange);
  ref.current = onChange;
  return ref;
}

// Fires onChange when a notification for the user is inserted/updated/deleted.
export function useRealtimeNotifications(
  userId: string | undefined,
  onChange: () => void,
): void {
  const cb = useStableCallback(onChange);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => cb.current(),
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [userId, cb]);
}

// Fires onChange when any conversation the user belongs to changes (a new
// message bumps conversations.last_message_at). RLS scopes delivery.
export function useRealtimeConversationList(onChange: () => void): void {
  const cb = useStableCallback(onChange);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase
      .channel('conversation-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => cb.current(),
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [cb]);
}

// Fires onChange when a message in the active conversation is inserted or
// updated (new message / read receipt).
export function useRealtimeConversationMessages(
  conversationId: string | null,
  onChange: () => void,
): void {
  const cb = useStableCallback(onChange);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => cb.current(),
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, cb]);
}
