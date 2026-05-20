import assert from 'node:assert/strict';
import { integrationSuite } from './helpers/suite';
import { apiRequest } from './helpers/http';
import {
  uniqueEmail,
  uniquePhone,
  trackUser,
  trackOtpPhone,
  seedOtp,
  getOtpRow,
} from './helpers/db';

// POST /api/auth/send-otp + /api/auth/verify-otp — phone OTP flow.
// The plaintext OTP is never returned by the API, so the success/attempt
// cases seed otp_codes directly with a known code (see helpers/db.seedOtp).

const { itest } = integrationSuite();

itest('send-otp returns a masked phone and stores an otp row', async (server) => {
  const phone = uniquePhone();
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/send-otp', {
    body: { phone },
  });
  trackOtpPhone(phone);

  assert.equal(res.status, 200);
  const row = await getOtpRow(phone);
  assert.ok(row, 'expected an otp_codes row after send-otp');
});

itest('verify-otp accepts the correct code and marks the phone verified', async (server) => {
  const phone = uniquePhone();
  // A profile must exist for that phone — register a user with it first.
  const reg = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
    body: {
      email: uniqueEmail(),
      phone,
      password: 'Password123!',
      name: 'OTP User',
      role: 'brand',
      termsAccepted: true,
    },
  });
  trackUser((reg.body as { user?: { id: string } }).user?.id);
  assert.equal(reg.status, 201, 'fixture registration should succeed');

  await seedOtp(phone, '123456');
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/verify-otp', {
    body: { phone, otp: '123456' },
  });

  assert.equal(res.status, 200);
  assert.equal((res.body as { phoneVerified?: boolean }).phoneVerified, true);
});

itest('verify-otp rejects a wrong code and increments attempts', async (server) => {
  const phone = uniquePhone();
  await seedOtp(phone, '111111');
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/verify-otp', {
    body: { phone, otp: '999999' },
  });

  assert.equal(res.status, 400);
  const row = await getOtpRow(phone);
  assert.equal(row?.attempts, 1);
});

itest('verify-otp rejects an expired code', async (server) => {
  const phone = uniquePhone();
  await seedOtp(phone, '123456', { expiresInMs: -1000 });
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/verify-otp', {
    body: { phone, otp: '123456' },
  });
  assert.equal(res.status, 400);
});

itest('verify-otp locks out after 5 attempts', async (server) => {
  const phone = uniquePhone();
  await seedOtp(phone, '123456', { attempts: 5 });
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/verify-otp', {
    body: { phone, otp: '123456' },
  });
  assert.equal(res.status, 429);
});

itest('verify-otp rejects a phone with no pending code', async (server) => {
  const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/verify-otp', {
    body: { phone: uniquePhone(), otp: '123456' },
  });
  assert.equal(res.status, 400);
});
