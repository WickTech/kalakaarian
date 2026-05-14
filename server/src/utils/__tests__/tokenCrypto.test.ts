import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

const VALID_KEY = crypto.randomBytes(32).toString('base64');

function loadFresh() {
  delete require.cache[require.resolve('../tokenCrypto')];
  return require('../tokenCrypto') as typeof import('../tokenCrypto');
}

test('encrypt → decrypt roundtrip', () => {
  process.env.TOKEN_ENCRYPTION_KEY = VALID_KEY;
  const { encryptToken, decryptToken } = loadFresh();
  const plain = 'EAAGm...page-access-token-xyz';
  const packed = encryptToken(plain);
  assert.notEqual(packed, plain);
  assert.equal(packed.split(':').length, 3);
  assert.equal(decryptToken(packed), plain);
});

test('two encryptions of same plaintext produce different ciphertexts (random IV)', () => {
  process.env.TOKEN_ENCRYPTION_KEY = VALID_KEY;
  const { encryptToken } = loadFresh();
  const a = encryptToken('same-secret');
  const b = encryptToken('same-secret');
  assert.notEqual(a, b);
});

test('tampered ciphertext throws', () => {
  process.env.TOKEN_ENCRYPTION_KEY = VALID_KEY;
  const { encryptToken, decryptToken } = loadFresh();
  const packed = encryptToken('token-abc');
  const [iv, tag, cipher] = packed.split(':');
  const flipped = Buffer.from(cipher, 'base64');
  flipped[0] ^= 0xff;
  const tampered = `${iv}:${tag}:${flipped.toString('base64')}`;
  assert.throws(() => decryptToken(tampered));
});

test('wrong-length key throws', () => {
  process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');
  const { encryptToken } = loadFresh();
  assert.throws(() => encryptToken('x'), /32 bytes/);
});

test('missing env throws', () => {
  delete process.env.TOKEN_ENCRYPTION_KEY;
  const { encryptToken } = loadFresh();
  assert.throws(() => encryptToken('x'), /not set/);
});

test('decrypt with wrong key throws', () => {
  process.env.TOKEN_ENCRYPTION_KEY = VALID_KEY;
  const { encryptToken } = loadFresh();
  const packed = encryptToken('token-abc');
  process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  const { decryptToken } = loadFresh();
  assert.throws(() => decryptToken(packed));
});

test('decryptToken rejects malformed input', () => {
  process.env.TOKEN_ENCRYPTION_KEY = VALID_KEY;
  const { decryptToken } = loadFresh();
  assert.throws(() => decryptToken('only:two'), /invalid format/);
  assert.throws(() => decryptToken(''), /empty input/);
});
