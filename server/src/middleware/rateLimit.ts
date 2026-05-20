import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

// Centralized rate-limiter factory. Use this instead of calling rateLimit()
// directly so every limiter shares the same behaviour:
//
//  - disabled under NODE_ENV=test, so integration suites don't trip
//    production throttles (always active outside test);
//  - the `as unknown as RequestHandler` cast (works around an
//    @types/express-serve-static-core version mismatch between the root and
//    server node_modules) lives in one place.

const testMode = process.env.NODE_ENV === 'test';
const passthrough: RequestHandler = (_req, _res, next) => next();

export function createRateLimiter(opts: Parameters<typeof rateLimit>[0]): RequestHandler {
  return testMode ? passthrough : (rateLimit(opts) as unknown as RequestHandler);
}
