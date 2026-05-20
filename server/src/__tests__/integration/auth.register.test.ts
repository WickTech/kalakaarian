import assert from 'node:assert/strict';
import { integrationSuite } from './helpers/suite';
import { apiRequest } from './helpers/http';
import { uniqueEmail, trackUser } from './helpers/db';

// POST /api/auth/register — integration coverage for the registration flow.

const { itest } = integrationSuite();

const STRONG_PASSWORD = 'Password123!';

const brandBody = (email: string) => ({
  email,
  password: STRONG_PASSWORD,
  name: 'Integration Brand',
  role: 'brand',
  companyName: 'Acme Co',
  industry: 'Retail',
  termsAccepted: true,
});

itest('registers a brand and returns a session token', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: brandBody(uniqueEmail()),
  });
  const body = res.body as { user?: { id: string; role: string }; token?: string };
  trackUser(body.user?.id);

  assert.equal(res.status, 201);
  assert.equal(body.user?.role, 'brand');
  assert.ok(body.token, 'expected a session token in the response');
});

itest('registers an influencer with pricing', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: {
      email: uniqueEmail(),
      password: STRONG_PASSWORD,
      name: 'Integration Creator',
      role: 'influencer',
      termsAccepted: true,
      niches: ['Fashion'],
      platform: ['instagram'],
      tier: 'micro',
      gender: 'female',
      pricing: { reel: 5000, story: 2000 },
    },
  });
  const body = res.body as { user?: { id: string; role: string } };
  trackUser(body.user?.id);

  assert.equal(res.status, 201);
  assert.equal(body.user?.role, 'influencer');
});

itest('rejects registration without accepted terms', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: { ...brandBody(uniqueEmail()), termsAccepted: false },
  });
  assert.equal(res.status, 400);
});

itest('rejects a password shorter than 8 characters', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: { ...brandBody(uniqueEmail()), password: 'short1' },
  });
  assert.equal(res.status, 400);
});

itest('rejects registration with neither email nor phone', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: {
      password: STRONG_PASSWORD,
      name: 'No Contact',
      role: 'brand',
      termsAccepted: true,
    },
  });
  assert.equal(res.status, 400);
});

itest('rejects a duplicate email', async (server) => {
  const email = uniqueEmail();
  const first = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: brandBody(email),
  });
  trackUser((first.body as { user?: { id: string } }).user?.id);
  assert.equal(first.status, 201);

  const second = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: brandBody(email),
  });
  trackUser((second.body as { user?: { id: string } }).user?.id);
  assert.equal(second.status, 400);
});
