import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolveTestEnv, applyTestEnv } from './env';

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

// Boots the real Express app on an ephemeral port. The app module is imported
// dynamically AFTER the test env is applied, so config/supabase.ts initializes
// against the test project.
export async function startTestServer(): Promise<TestServer> {
  applyTestEnv(resolveTestEnv());

  const { default: app } = await import('../../../app');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
