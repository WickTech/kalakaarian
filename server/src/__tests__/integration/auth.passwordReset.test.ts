import assert from 'node:assert/strict';
import type { TestServer } from './helpers/server';
import { integrationSuite } from './helpers/suite';
import { apiRequest } from './helpers/http';
import {
  uniqueEmail,
  trackUser,
  seedResetToken,
  testAdminClient,
} from './helpers/db';

// /api/auth/forgot-password, /validate-reset-token, /reset-password.
// Plaintext reset tokens are never returned by the API, so token-dependent
// cases seed password_reset_tokens directly (see helpers/db.seedResetToken).

const { itest } = integrationSuite();

const STRONG_PASSWORD = 'Password123!';

async function registerUser(server: TestServer): Promise<{ email: string; userId: string }> {
  const email = uniqueEmail();
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: {
      email,
      password: STRONG_PASSWORD,
      name: 'Reset Test User',
      role: 'brand',
      companyName: 'Acme Co',
      termsAccepted: true,
    },
  });
  const userId = (res.body as { user?: { id: string } }).user?.id as string;
  trackUser(userId);
  assert.equal(res.status, 201, 'fixture registration should succeed');
  return { email, userId };
}

itest('forgot-password returns a generic 200 for an unknown email', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/forgot-password', {
    body: { email: uniqueEmail() },
  });
  assert.equal(res.status, 200);
});

itest('forgot-password issues a reset token for a known email', async (server) => {
  const { email, userId } = await registerUser(server);
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/forgot-password', {
    body: { email },
  });
  assert.equal(res.status, 200);

  const { count } = await testAdminClient()
    .from('password_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  assert.ok((count ?? 0) >= 1, 'expected a reset token row for the user');
});

itest('validate-reset-token reports invalid for a missing token', async (server) => {
  const res = await apiRequest(server.baseUrl, 'GET', '/api/auth/validate-reset-token');
  assert.equal(res.status, 200);
  assert.equal((res.body as { valid?: boolean }).valid, false);
});

itest('validate-reset-token reports valid for a fresh token', async (server) => {
  const { userId } = await registerUser(server);
  const token = await seedResetToken(userId);
  const res = await apiRequest(
    server.baseUrl,
    'GET',
    `/api/auth/validate-reset-token?token=${token}`,
  );
  assert.equal(res.status, 200);
  assert.equal((res.body as { valid?: boolean }).valid, true);
});

itest('validate-reset-token reports used for a consumed token', async (server) => {
  const { userId } = await registerUser(server);
  const token = await seedResetToken(userId, { used: true });
  const res = await apiRequest(
    server.baseUrl,
    'GET',
    `/api/auth/validate-reset-token?token=${token}`,
  );
  const body = res.body as { valid?: boolean; reason?: string };
  assert.equal(body.valid, false);
  assert.equal(body.reason, 'used');
});

itest('validate-reset-token reports expired for an old token', async (server) => {
  const { userId } = await registerUser(server);
  const token = await seedResetToken(userId, { expiresInMs: -1000 });
  const res = await apiRequest(
    server.baseUrl,
    'GET',
    `/api/auth/validate-reset-token?token=${token}`,
  );
  const body = res.body as { valid?: boolean; reason?: string };
  assert.equal(body.valid, false);
  assert.equal(body.reason, 'expired');
});

itest('reset-password rejects a weak password', async (server) => {
  const { userId } = await registerUser(server);
  const token = await seedResetToken(userId);
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/reset-password', {
    body: { token, password: 'password' },
  });
  assert.equal(res.status, 400);
});

itest('reset-password succeeds once and rejects token reuse', async (server) => {
  const { userId } = await registerUser(server);
  const token = await seedResetToken(userId);

  const first = await apiRequest(server.baseUrl, 'POST', '/api/auth/reset-password', {
    body: { token, password: 'NewPassword123!' },
  });
  assert.equal(first.status, 200);

  const second = await apiRequest(server.baseUrl, 'POST', '/api/auth/reset-password', {
    body: { token, password: 'NewPassword123!' },
  });
  assert.equal(second.status, 400);
});
