const { test } = require('node:test');
const assert = require('node:assert/strict');
const auth = require('#src/services/auth.js');

test('parses JWT from a single Set-Cookie string with attributes', () => {
  const raw = 'JWT=abc.def.ghi; Max-Age=31556926; Path=/; SameSite=Lax; HttpOnly';
  assert.equal(auth.parseJwtFromSetCookie(raw), 'JWT=abc.def.ghi');
});

test('parses JWT out of an array of Set-Cookie headers', () => {
  const raw = ['other=1; Path=/', 'JWT=abc.def.ghi; Max-Age=1; Path=/; HttpOnly'];
  assert.equal(auth.parseJwtFromSetCookie(raw), 'JWT=abc.def.ghi');
});

test('returns null when no JWT cookie is present', () => {
  assert.equal(auth.parseJwtFromSetCookie(['other=1; Path=/']), null);
  assert.equal(auth.parseJwtFromSetCookie(undefined), null);
});
