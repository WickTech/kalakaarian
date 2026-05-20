import assert from 'node:assert/strict';
import type { TestServer } from './helpers/server';
import { integrationSuite } from './helpers/suite';
import { apiRequest } from './helpers/http';
import { uniqueEmail, trackUser } from './helpers/db';

// POST /api/auth/login — integration coverage for the login flow.

const { itest } = integrationSuite();

const PASSWORD = 'Password123!';

interface RegisteredUser {
  email: string;
  username?: string;
  userId: string;
}

async function registerBrand(
  server: TestServer,
  opts: { username?: string } = {},
): Promise<RegisteredUser> {
  const email = uniqueEmail();
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: {
      email,
      username: opts.username,
      password: PASSWORD,
      name: 'Login Test Brand',
      role: 'brand',
      companyName: 'Acme Co',
      termsAccepted: true,
    },
  });
  const userId = (res.body as { user?: { id: string } }).user?.id as string;
  trackUser(userId);
  assert.equal(res.status, 201, 'fixture registration should succeed');
  return { email, username: opts.username, userId };
}

itest('logs in with email + password', async (server) => {
  const user = await registerBrand(server);
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
    body: { email: user.email, password: PASSWORD },
  });
  const body = res.body as { token?: string; user?: { role: string } };

  assert.equal(res.status, 200);
  assert.ok(body.token, 'expected a session token');
  assert.equal(body.user?.role, 'brand');
});

itest('logs in with username + password', async (server) => {
  const username = `it_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const user = await registerBrand(server, { username });
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
    body: { username: user.username, password: PASSWORD },
  });

  assert.equal(res.status, 200);
  assert.ok((res.body as { token?: string }).token);
});

itest('rejects a wrong password', async (server) => {
  const user = await registerBrand(server);
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
    body: { email: user.email, password: 'WrongPassword9!' },
  });
  assert.equal(res.status, 400);
});

itest('rejects login with no password', async (server) => {
  const user = await registerBrand(server);
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
    body: { email: user.email },
  });
  assert.equal(res.status, 400);
});

itest('rejects login with neither email nor username', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
    body: { password: PASSWORD },
  });
  assert.equal(res.status, 400);
});

itest('rejects an unknown username', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
    body: { username: `nobody_${Date.now()}`, password: PASSWORD },
  });
  assert.equal(res.status, 400);
});
