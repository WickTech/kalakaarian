import { test, before, after } from 'node:test';
import { resolveTestEnv } from './env';
import { startTestServer, TestServer } from './server';
import { cleanup } from './db';

// Shared lifecycle for an integration test file: boots one server before the
// file's tests, tears it down + cleans created rows after. When integration
// tests are disabled, every test is skipped with the reason as its message.

export interface IntegrationSuite {
  itest: (name: string, fn: (server: TestServer) => void | Promise<void>) => void;
}

export function integrationSuite(): IntegrationSuite {
  const env = resolveTestEnv();
  let server: TestServer | undefined;

  before(async () => {
    if (env.enabled) server = await startTestServer();
  });

  after(async () => {
    if (env.enabled) await cleanup();
    if (server) await server.close();
  });

  const itest = (
    name: string,
    fn: (server: TestServer) => void | Promise<void>,
  ): void => {
    test(name, { skip: env.enabled ? false : env.reason }, async () => {
      await fn(server as TestServer);
    });
  };

  return { itest };
}
