import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backoffMs } from '../backoff';

test('backoffMs doubles each attempt: 1m, 2m, 4m', () => {
  assert.equal(backoffMs(1), 60_000);
  assert.equal(backoffMs(2), 120_000);
  assert.equal(backoffMs(3), 240_000);
});

test('backoffMs caps at 1 hour', () => {
  assert.equal(backoffMs(20), 60 * 60_000);
});

test('backoffMs does not go below the first interval for attempt 0', () => {
  assert.equal(backoffMs(0), 60_000);
});
