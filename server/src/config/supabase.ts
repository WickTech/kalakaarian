import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client — bypasses RLS. Server-side use only. Never expose to client.
export const adminClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// Ephemeral client factory. Use this anywhere you need signInWithPassword,
// otherwise the module-level adminClient's session gets mutated and on the
// next warm-lambda request its .from() calls will send the previous user's
// JWT to PostgREST, triggering RLS denials on inserts.
export const createAuthClient = () =>
  createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
