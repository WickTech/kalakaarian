import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client — bypasses RLS. Server-side use only. Never expose to client.
export const adminClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
