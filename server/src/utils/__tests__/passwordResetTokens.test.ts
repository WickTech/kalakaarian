import { test } from 'node:test';
import assert from 'node:assert/strict';

const PEPPER = 'a'.repeat(64);

function loadFresh() {
  delete require.cache[require.resolve('../passwordResetTokens')];
  return require('../passwordResetTokens') as typeof import('../passwordResetTokens');
}

test('generateToken returns 64-char lowercase hex', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { generateToken } = loadFresh();
  const t = generateToken();
  assert.match(t, /^[a-f0-9]{64}$/);
});

test('two generated tokens differ', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { generateToken } = loadFresh();
  assert.notEqual(generateToken(), generateToken());
});

test('hashToken is deterministic with same pepper', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { hashToken } = loadFresh();
  const t = 'abc'.repeat(20).slice(0, 64);
  assert.equal(hashToken(t), hashToken(t));
});

test('hashToken changes when pepper changes', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const a = loadFresh().hashToken('token');
  process.env.RESET_TOKEN_PEPPER = 'b'.repeat(64);
  const b = loadFresh().hashToken('token');
  assert.notEqual(a, b);
});

test('hashToken throws when pepper missing or too short', () => {
  delete process.env.RESET_TOKEN_PEPPER;
  const { hashToken } = loadFresh();
  assert.throws(() => hashToken('x'), /RESET_TOKEN_PEPPER/);
  process.env.RESET_TOKEN_PEPPER = 'short';
  const fresh = loadFresh();
  assert.throws(() => fresh.hashToken('x'), /RESET_TOKEN_PEPPER/);
});

test('STRONG_PASSWORD_RE accepts compliant passwords', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { STRONG_PASSWORD_RE } = loadFresh();
  assert.ok(STRONG_PASSWORD_RE.test('Abcdef1!'));
  assert.ok(STRONG_PASSWORD_RE.test('Strong#Pass9'));
});

test('STRONG_PASSWORD_RE rejects weak passwords', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { STRONG_PASSWORD_RE } = loadFresh();
  assert.equal(STRONG_PASSWORD_RE.test('short1!'), false);          // <8
  assert.equal(STRONG_PASSWORD_RE.test('alllowercase1!'), false);   // no upper
  assert.equal(STRONG_PASSWORD_RE.test('ALLUPPER1!'), false);       // no lower
  assert.equal(STRONG_PASSWORD_RE.test('NoDigits!!'), false);       // no digit
  assert.equal(STRONG_PASSWORD_RE.test('NoSpecial1'), false);       // no special
});

test('TOKEN_TTL_MS is 20 minutes', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { TOKEN_TTL_MS } = loadFresh();
  assert.equal(TOKEN_TTL_MS, 20 * 60 * 1000);
});

test('safeEqualHex true for identical hashes', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { hashToken, safeEqualHex } = loadFresh();
  const h = hashToken('hello');
  assert.equal(safeEqualHex(h, h), true);
});

test('safeEqualHex false for differing hashes', () => {
  process.env.RESET_TOKEN_PEPPER = PEPPER;
  const { hashToken, safeEqualHex } = loadFresh();
  assert.equal(safeEqualHex(hashToken('a'), hashToken('b')), false);
});
