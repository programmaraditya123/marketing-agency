/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('node:http');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

test('Next.js API proxy forwards cookies, query, Origin and POST without browser CORS', { timeout: 120000 }, async () => {
  const seen = [];
  const upstream = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, headers: req.headers, body });
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      if (req.url === '/api/v1/test/session') {
        res.setHeader('Set-Cookie', 'orbit_session=proxy-test; Path=/api/v1; HttpOnly; SameSite=Lax');
      }
      if (req.url === '/api/v1/test/denied') res.statusCode = 401;
      res.end(JSON.stringify({ ok: res.statusCode === 200 }));
    });
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const reservation = http.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const root = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
  const fixture = fs.mkdtempSync(path.join(root, '.tmp', 'api-proxy-'));
  fs.copyFileSync(path.join(root, 'next.config.ts'), path.join(fixture, 'next.config.ts'));
  fs.writeFileSync(path.join(fixture, 'package.json'), '{"name":"orbit-proxy-check","private":true}');
  fs.mkdirSync(path.join(fixture, 'app'));
  fs.writeFileSync(path.join(fixture, 'app/page.js'), 'export default function Page() { return "proxy check"; }');
  fs.writeFileSync(path.join(fixture, 'app/layout.js'), 'import {createElement} from "react"; export default function Layout({children}) { return createElement("html", null, createElement("body", null, children)); }');
  let output = '';
  const next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: fixture,
    env: { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', ORBIT_BACKEND_URL: `http://127.0.0.1:${upstream.address().port}/api/v1` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  next.stdout.on('data', chunk => { output += chunk; });
  next.stderr.on('data', chunk => { output += chunk; });
  const origin = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 90000;
    let session;
    while (Date.now() < deadline) {
      if (next.exitCode !== null) throw new Error(`Next exited: ${output}`);
      try {
        session = await fetch(`${origin}/api/v1/test/session`, { signal: AbortSignal.timeout(2000) });
        if (session.ok) break;
      } catch { /* Wait for the isolated dev server to listen. */ }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    assert.equal(session?.status, 200, output);
    assert.match(session.headers.get('set-cookie'), /orbit_session=proxy-test; Path=\/api\/v1; HttpOnly/);
    assert.equal(session.headers.get('cache-control'), 'no-store');
    const response = await fetch(`${origin}/api/v1/test/brief?cursor=a%2Bb`, {
      method: 'POST',
      headers: { Origin: 'https://orbit.vidorahub.com', Cookie: 'orbit_session=proxy-test', 'X-Orbit-Request': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: 'Example' }),
    });
    assert.equal(response.status, 200);
    const request = seen.find(req => req.method === 'POST');
    assert.equal(request.url, '/api/v1/test/brief?cursor=a%2Bb');
    assert.equal(request.headers.cookie, 'orbit_session=proxy-test');
    assert.equal(request.headers.origin, 'https://orbit.vidorahub.com');
    assert.equal(request.headers['x-orbit-request'], '1');
    assert.deepEqual(JSON.parse(request.body), { product: 'Example' });
    const denied = await fetch(`${origin}/api/v1/test/denied`);
    assert.equal(denied.status, 401);
    assert.equal(denied.headers.get('cache-control'), 'no-store');
    assert.equal(seen.some(req => req.method === 'OPTIONS'), false);
  } finally {
    next.kill('SIGTERM');
    next.stdout.destroy();
    next.stderr.destroy();
    next.unref();
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
});
