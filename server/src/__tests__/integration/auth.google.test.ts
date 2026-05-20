import assert from 'node:assert/strict';
import { integrationSuite } from './helpers/suite';
import { apiRequest } from './helpers/http';
import { uniqueEmail, trackUser } from './helpers/db';

// /api/auth/google + /api/auth/complete-onboarding.
//
// A real Google ID token cannot be minted in tests, so the happy path of
// googleLogin is not covered here — see REFACTOR_STATUS.md. These tests cover
// the input-validation + guard branches that do not need a real Google token.

const { itest } = integrationSuite();

itest('google login rejects a missing ID token', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/google', {
    body: {},
  });
  assert.equal(res.status, 400);
});

itest('google login rejects an invalid ID token', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/google', {
    body: { token: 'not-a-real-google-id-token' },
  });
  assert.equal(res.status, 400);
});

itest('complete-onboarding requires authentication', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/complete-onboarding', {
    body: { role: 'brand' },
  });
  assert.equal(res.status, 401);
});

itest('complete-onboarding rejects an invalid role', async (server) => {
  const reg = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: {
      email: uniqueEmail(),
      password: 'Password123!',
      name: 'Onboarding Guard',
      role: 'brand',
      companyName: 'Acme Co',
      termsAccepted: true,
    },
  });
  const body = reg.body as { user?: { id: string }; token?: string };
  trackUser(body.user?.id);
  assert.equal(reg.status, 201, 'fixture registration should succeed');

  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/complete-onboarding', {
    body: { role: 'superuser' },
    token: body.token,
  });
  assert.equal(res.status, 400);
});
