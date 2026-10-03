import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const store = resolve('node_modules/.pnpm');
function installed(name, version) {
  const copies = readdirSync(store).filter(p => p.startsWith(`${name}@${version}`));
  assert.equal(copies.length, 1, `Expected exactly one installed ${name} artifact`);
  return resolve(store, copies[0], 'node_modules', name);
}
// Overrides support the negative control against isolated original tarballs.
const braces = require(process.env.REGRESSION_BRACES_DIR || installed('braces', '3.0.3'));
const CachePolicy = require(process.env.REGRESSION_CACHE_DIR || installed('http-cache-semantics', '4.2.0'));
const pattern = (depth, open = '{', close = '}') => open.repeat(depth) + 'x' + close.repeat(depth);

test('braces rejects deep brace, parenthesis and mixed strings before recursive walking', () => {
  for (const input of [pattern(4000), pattern(4000, '(', ')'), pattern(2000, '{(', ')}')]) {
    for (const operation of ['parse', 'compile', 'expand', 'stringify']) {
      assert.throws(() => braces[operation](input), { name: 'SyntaxError', message: /exceeds max depth/ });
    }
  }
});

test('braces bounds caller-supplied ASTs and cycles', () => {
  const ast = () => {
    const root = { type: 'root', nodes: [] };
    let node = root;
    for (let i = 0; i < 150; i++) {
      const child = { type: 'paren', nodes: [] };
      node.nodes.push(child);
      node = child;
    }
    return root;
  };
  for (const operation of ['compile', 'expand', 'stringify']) {
    assert.throws(() => braces[operation](ast()), /exceeds max depth/);
    const cycle = { type: 'root', nodes: [] };
    cycle.nodes.push(cycle);
    assert.throws(() => braces[operation](cycle), /exceeds max depth/);
  }
});

test('braces preserves ordinary expansion, escaping, and the safe depth boundary', () => {
  assert.deepEqual(braces.expand('src/{api,web}/file{1..2}.ts'), [
    'src/api/file1.ts', 'src/api/file2.ts', 'src/web/file1.ts', 'src/web/file2.ts',
  ]);
  for (const operation of ['parse', 'compile', 'expand', 'stringify']) {
    assert.doesNotThrow(() => braces[operation](pattern(100)));
    assert.throws(() => braces[operation](pattern(101), { maxDepth: Infinity }), /exceeds max depth/);
    assert.throws(() => braces[operation](pattern(101), { maxDepth: 10000 }), /exceeds max depth/);
    assert.throws(() => braces[operation](pattern(3), { maxDepth: 2 }), /exceeds max depth/);
    assert.doesNotThrow(() => braces[operation]('\\{'.repeat(200) + 'x'));
  }
});

const request = headers => ({ url: 'https://synthetic.invalid/example', method: 'GET', headers: { host: 'synthetic.invalid', ...headers } });
function policy(headers, options = {}, requestHeaders = {}) {
  const p = new CachePolicy(request(requestHeaders), { status: 200, headers }, options);
  const now = p.now();
  p.now = () => now + 2000;
  return p;
}
const prohibited = [
  { 'set-cookie': 'synthetic=value', 'cache-control': 'max-age=600' },
  { 'cache-control': 'proxy-revalidate, max-age=600' },
  { 'cache-control': 'no-cache, max-age=600' },
  { 'cache-control': 'no-store, max-age=600' },
  { 'cache-control': 'private, max-age=600' },
  { 'cache-control': 'must-revalidate, max-age=0' },
  { vary: '*', 'cache-control': 'max-age=600' },
];

test('cache max-stale cannot override security-zeroed entries', () => {
  for (const headers of prohibited) {
    for (const directive of ['max-stale', 'max-stale=999999']) {
      const p = policy(headers);
      const req = request({ 'cache-control': directive });
      assert.equal(p.satisfiesWithoutRevalidation(req), false, JSON.stringify(headers));
      const result = p.evaluateRequest(req);
      assert.equal(result.response, undefined);
      assert.equal(result.revalidation.synchronous, true);
    }
  }
});

test('cache stale-while-revalidate and stale-if-error cannot bypass prohibitions', () => {
  for (const headers of prohibited) {
    const p = policy({ ...headers, 'cache-control': `${headers['cache-control']}, stale-while-revalidate=600, stale-if-error=600` });
    assert.equal(p.useStaleWhileRevalidate(), false);
    assert.equal(p.evaluateRequest(request()).response, undefined);
    const revalidated = p.revalidatedPolicy(request(), { status: 500, headers: {} });
    assert.equal(revalidated.matches, false);
  }
});

test('cache serialization preserves security prohibitions', () => {
  for (const headers of prohibited) {
    const restored = CachePolicy.fromObject(policy(headers).toObject());
    assert.equal(restored.satisfiesWithoutRevalidation(request({ 'cache-control': 'max-stale' })), false);
  }
});

test('cache preserves public/private cache options, normal freshness and ordinary stale opt-in', () => {
  assert.equal(policy({ 'cache-control': 'public, max-age=600' }).satisfiesWithoutRevalidation(request()), true);
  assert.equal(policy({ 'set-cookie': 'synthetic=value', 'cache-control': 'public, max-age=600' }).satisfiesWithoutRevalidation(request()), true);
  assert.equal(policy({ 'set-cookie': 'synthetic=value', 'cache-control': 'private, max-age=600' }, { shared: false }).satisfiesWithoutRevalidation(request()), true);
  const expired = policy({ 'cache-control': 'public, max-age=1' });
  assert.equal(expired.satisfiesWithoutRevalidation(request()), false);
  assert.equal(expired.satisfiesWithoutRevalidation(request({ 'cache-control': 'max-stale=10' })), true);
  const swr = policy({ 'cache-control': 'public, max-age=1, stale-while-revalidate=60' });
  assert.ok(swr.evaluateRequest(request()).response);
  assert.equal(swr.evaluateRequest(request()).revalidation.synchronous, false);
});

test('cache rejects mismatched URL, Vary, and unauthorized shared entries', () => {
  const p = policy({ vary: 'accept-language', 'cache-control': 'public, max-age=600' }, {}, { 'accept-language': 'en' });
  assert.equal(p.satisfiesWithoutRevalidation(request({ 'accept-language': 'es', 'cache-control': 'max-stale' })), false);
  assert.equal(p.satisfiesWithoutRevalidation({ ...request(), url: 'https://synthetic.invalid/other' }), false);
  const auth = policy({ 'cache-control': 'max-age=600' }, {}, { authorization: 'synthetic' });
  assert.equal(auth.satisfiesWithoutRevalidation(request({ 'cache-control': 'max-stale' })), false);
});
