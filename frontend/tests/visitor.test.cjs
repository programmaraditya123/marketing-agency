/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/visitor.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function browser(storage) {
  const context = { exports: {}, crypto: webcrypto, Uint8Array, ...(storage ? { window: { localStorage: storage } } : {}) };
  vm.runInNewContext(source, context);
  return context.exports;
}
test('frontend creates one persistent random ID and accepts the server-confirmed identity', () => {
  const values = new Map();
  const api = browser({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) });
  const id = api.getVisitorId();
  assert.match(id, /^[a-f0-9]{64}$/);
  assert.equal(api.getVisitorId(), id);
  assert.equal(values.get('orbit_visitor_id'), id);
  api.rememberVisitorId('a'.repeat(64));
  assert.equal(api.getVisitorId(), 'a'.repeat(64));
  api.rememberVisitorId('malformed');
  assert.equal(api.getVisitorId(), 'a'.repeat(64));
});
test('visitor generation has an SSR-safe and blocked-storage fallback', () => {
  assert.equal(browser().getVisitorId(), undefined);
  const blocked = browser({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  const id = blocked.getVisitorId();
  assert.match(id, /^[a-f0-9]{64}$/);
  assert.equal(blocked.getVisitorId(), id);
  blocked.rememberVisitorId('b'.repeat(64));
  assert.equal(blocked.getVisitorId(), 'b'.repeat(64));
});
