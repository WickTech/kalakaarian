// Integration-test config resolver.
//
// Integration tests are OPT-IN. They run real HTTP requests against the real
// Express app talking to a real Supabase project, so they require a DEDICATED
// Supabase test project — never production.
//
// Enable by setting (in server/.env or the shell):
//   SUPABASE_TEST_URL=...
//   SUPABASE_TEST_SERVICE_ROLE_KEY=...
//
// When unset, every integration test is skipped and `npm test` stays green.

export interface TestEnv {
  enabled: boolean;
  reason: string;
  supabaseUrl?: string;
  serviceKey?: string;
}

let cached: TestEnv | undefined;

export function resolveTestEnv(): TestEnv {
  if (cached) return cached;

  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    cached = {
      enabled: false,
      reason: 'integration tests skipped — SUPABASE_TEST_URL / SUPABASE_TEST_SERVICE_ROLE_KEY not set',
    };
    return cached;
  }

  // Safety guard: refuse to run if the test URL matches the configured prod URL.
  if (process.env.SUPABASE_URL && process.env.SUPABASE_URL === supabaseUrl) {
    cached = {
      enabled: false,
      reason: 'SUPABASE_TEST_URL must differ from SUPABASE_URL — refusing to run against production',
    };
    return cached;
  }

  cached = { enabled: true, reason: '', supabaseUrl, serviceKey };
  return cached;
}

// Points the app's Supabase + secret env at the test project. MUST run before
// the app module is imported. dotenv (loaded inside app.ts) does not override
// already-set process.env values, so these stick.
export function applyTestEnv(env: TestEnv): void {
  if (!env.enabled) return;
  process.env.SUPABASE_URL = env.supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.serviceKey;
  process.env.SUPABASE_ANON_KEY ||= env.serviceKey;
  process.env.NODE_ENV = 'test';
  // password-reset routes hash tokens with this pepper (≥32 chars required).
  process.env.RESET_TOKEN_PEPPER ||= 'integration-test-reset-pepper-0123456789abcdef';
}
