// Client-side Supabase singleton — used for realtime subscriptions only.
// REST writes still go through the Express API (lib/api.ts) so all
// business logic stays server-side. RLS is the only gate on what
// realtime payloads any given session can see.
//
// Returns null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
// not set so callers can gracefully fall back to polling.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !key) {
    cached = null;
    if (import.meta.env.DEV) {
      console.warn(
        '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set. ' +
        'Realtime subscriptions disabled; polling fallback in use.',
      );
    }
    return cached;
  }

  cached = createClient(url, key, {
    auth: {
      // Don't compete with the existing axios auth flow; this client is
      // only here for realtime — never used for auth or data fetching.
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: { params: { eventsPerSecond: 5 } },
  });

  // Attach the user JWT so RLS recognises the user on subscriptions.
  // Read from the same localStorage key as api/axios.ts.
  const token = localStorage.getItem('kalakariaan_token');
  if (token) {
    cached.realtime.setAuth(token);
  }

  return cached;
}

// Allow re-authing the realtime socket when the user logs in / out
// without page reload.
export function setRealtimeAuth(token: string | null) {
  const client = getSupabase();
  if (!client) return;
  client.realtime.setAuth(token ?? '');
}
