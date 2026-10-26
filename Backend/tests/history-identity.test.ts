import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { memoryStore } from "./helpers/memory-store";
import { registerPlugins } from "../config/plugins";
import { registerErrorHandler } from "../config/error-handler";
import { registerRoutes } from "../config/routes";
import { registerIdentity } from "../modules/auth/auth.middleware";
import { createAuthService } from "../modules/auth/auth.helper";
import { createWorkspaceService } from "../modules/workspace/workspace.helper";
import { createRepository } from "../modules/crawlers/crawler.repository";
import { createCrawlService } from "../modules/crawlers/crawler.helper";
import { createJwt } from "../config/jwt";
import type { Environment } from "../config/env";
const env: Environment = { port: 9000, host: "127.0.0.1", mongoUri: "unused", mongoDatabase: "test", microserviceUrl: "http://localhost:8000", serviceToken: "s".repeat(32), jwtSecret: "j".repeat(40), cookieSecure: false, cookieSameSite: "Lax", corsOrigins: ["http://localhost:3000"] };
const account = { name: "History Owner", email: "history@example.com", password: "twelve-plus-characters" };
async function setup() {
  const memory = memoryStore(), app = Fastify();
  const store = { visitors: memory.visitors.collection, users: memory.users.collection, sessions: memory.sessions.collection, activities: memory.activities.collection, jobs: memory.jobs.collection };
  await registerPlugins(app, env); registerErrorHandler(app);
  const auth = createAuthService(store), workspace = createWorkspaceService(store.jobs, store.activities);
  registerIdentity(app, auth, env);
  const repository = createRepository(store.jobs);
  const service = createCrawlService(repository, async () => ({ company: {} }), app.log, async startUrl => ({ startUrl, pages: [], socialLinks: [], warnings: [] }));
  await registerRoutes(app, service, async () => {}, { auth, workspace, env });
  app.addHook("onClose", () => service.close());
  function browser(proposedId: string) {
    const jar = new Map<string, string>();
    let visitorId = proposedId;
    return { jar, get visitorId() { return visitorId; }, async request(url: string, payload?: object) {
      const response = await app.inject({ method: payload ? "POST" : "GET", url,
        headers: { cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; "), "x-orbit-visitor-id": visitorId, origin: "http://localhost:3000", "x-orbit-request": "1" }, payload });
      const cookies = response.headers["set-cookie"];
      for (const value of Array.isArray(cookies) ? cookies : cookies ? [String(cookies)] : []) {
        const pair = value.split(";")[0], split = pair.indexOf("="); jar.set(pair.slice(0, split), pair.slice(split + 1));
      }
      if (response.json().data?.visitorId) visitorId = response.json().data.visitorId;
      return response;
    } };
  }
  return { app, memory, browser };
}

test("frontend visitor ID survives session expiry, while unsigned/copied visitor IDs cannot access guest history", async t => {
  const { app, memory, browser } = await setup(); t.after(() => app.close());
  const visitorId = "1".repeat(64), first = browser(visitorId);
  assert.equal((await first.request("/api/v1/auth/me")).json().data.visitorId, visitorId);
  assert.ok(first.jar.has("orbit_session") && first.jar.has("orbit_visitor"));
  const report = await first.request("/api/v1/analyses", { startUrl: "https://8.8.8.8/" });
  assert.equal(report.statusCode, 202);
  assert.equal(memory.jobs.rows[0].visitorId, visitorId); assert.equal(memory.jobs.rows[0].userId, null);
  assert.equal(memory.activities.rows[0].visitorId, visitorId); assert.equal(memory.activities.rows[0].userId, null);
  const oldSession = memory.sessions.rows[0]._id; memory.sessions.rows[0].expiresAt = new Date(0);
  assert.equal((await first.request("/api/v1/history/guest")).statusCode, 401);
  await first.request("/api/v1/auth/me");
  assert.equal(first.visitorId, visitorId); assert.ok(memory.sessions.rows.some(session => session._id !== oldSession && session.visitorId === visitorId));
  assert.equal((await first.request("/api/v1/history/guest")).json().data.items.length, 1);
  const attacker = browser(visitorId); await attacker.request("/api/v1/auth/me");
  assert.notEqual(attacker.visitorId, visitorId);
  assert.deepEqual((await attacker.request("/api/v1/history/guest")).json().data.items, []);
  assert.equal((await attacker.request("/api/v1/history/user")).statusCode, 401);
  const proof = first.jar.get("orbit_visitor")!;
  const bearer = await app.inject({ url: "/api/v1/history/user", headers: { authorization: `Bearer ${proof}` } });
  assert.equal(bearer.statusCode, 401);
});

test("signup and multi-device login link visitor IDs and history; logout never exposes account history to guests", async t => {
  const { app, memory, browser } = await setup(); t.after(() => app.close());
  const a = browser("2".repeat(64)); await a.request("/api/v1/auth/me");
  await a.request("/api/v1/analyses", { startUrl: "https://8.8.8.8/" });
  const signedUp = await a.request("/api/v1/auth/register", account);
  assert.equal(signedUp.statusCode, 201); const userId = signedUp.json().data.user.id;
  assert.equal(memory.users.rows[0].userId, userId); assert.deepEqual(memory.users.rows[0].visitorIds, [a.visitorId]);
  assert.ok(memory.jobs.rows.every(job => job.userId === userId && job.visitorId === a.visitorId));
  assert.ok(memory.activities.rows.every(event => event.userId === userId && event.visitorId === a.visitorId));
  const b = browser("3".repeat(64)); await b.request("/api/v1/auth/me");
  await b.request("/api/v1/analyses", { startUrl: "https://8.8.4.4/" });
  assert.equal((await b.request("/api/v1/history/guest")).json().data.items.length, 1);
  const login = await b.request("/api/v1/auth/login", { email: account.email, password: account.password });
  assert.equal(login.statusCode, 200);
  assert.deepEqual(memory.users.rows[0].visitorIds, [a.visitorId, b.visitorId]);
  assert.equal(memory.users.rows[0].visitorId, b.visitorId);
  assert.equal((await b.request("/api/v1/history/user")).json().data.items.length, 2);
  assert.equal((await a.request("/api/v1/history/user")).json().data.items.length, 2);
  assert.ok(memory.jobs.rows.every(job => job.userId === userId));
  assert.deepEqual(new Set(memory.jobs.rows.map(job => job.visitorId)), new Set([a.visitorId, b.visitorId]));
  assert.equal((await b.request("/api/v1/history/guest")).statusCode, 409);
  assert.equal((await b.request("/api/v1/history/user?limit=51")).statusCode, 400);
  await b.request("/api/v1/auth/logout", {});
  assert.equal(b.visitorId, "3".repeat(64));
  assert.deepEqual((await b.request("/api/v1/history/guest")).json().data.items, []);
  assert.equal((await b.request("/api/v1/history/user")).statusCode, 401);
});

test("dedicated history API uses bounded stable cursors and returns only the current visitor's website items", async t => {
  const { app, memory, browser } = await setup(); t.after(() => app.close());
  const guest = browser("4".repeat(64)); await guest.request("/api/v1/auth/me");
  const createdAt = "2026-10-26T00:00:00.000Z";
  for (let i = 1; i <= 103; i++) memory.jobs.rows.push({ _id: i.toString(16).padStart(64, "0"), ownerId: `guest:${guest.visitorId}`, userId: null, visitorId: guest.visitorId,
    startUrl: `https://example.com/${i}`, status: "completed", createdAt, updatedAt: createdAt, analysis: { privateRawValue: "not-for-history" } });
  memory.jobs.rows.push({ _id: "f".repeat(64), ownerId: "guest:someone-else", startUrl: "https://private.example.com/", status: "completed", createdAt, updatedAt: createdAt });
  const ids: string[] = []; let cursor: string | null = null;
  do {
    const response = await guest.request(`/api/v1/history/guest?limit=20${cursor ? `&before=${cursor}` : ""}`);
    const page = response.json().data;
    assert.equal(page.scope, "guest"); assert.ok(page.items.length <= 20);
    assert.equal(page.hasMore, !!page.nextCursor);
    for (const item of page.items) { assert.equal(item.website, item.startUrl); assert.equal(item.analysis, undefined); assert.equal(item.ownerId, undefined); ids.push(item.id); }
    cursor = page.nextCursor;
  } while (cursor);
  assert.equal(ids.length, 103); assert.equal(new Set(ids).size, 103);
  assert.equal((await guest.request("/api/v1/history/guest?before=invalid")).statusCode, 400);
});

test("a valid legacy guest session binds existing history to its new permanent visitor ID", async t => {
  const { app, memory, browser } = await setup(); t.after(() => app.close());
  const sid = "a".repeat(64), visitorId = "5".repeat(64), ownerId = `guest:${sid}`;
  memory.sessions.rows.push({ _id: sid, ownerId, createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000) });
  memory.jobs.rows.push({ _id: "b".repeat(64), ownerId, startUrl: "https://legacy.example.com", status: "completed", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const guest = browser(visitorId); guest.jar.set("orbit_session", createJwt(env.jwtSecret).issue(sid));
  assert.equal((await guest.request("/api/v1/auth/me")).statusCode, 200);
  assert.equal((await guest.request("/api/v1/history/guest")).json().data.items.length, 1);
  assert.equal(memory.jobs.rows[0].visitorId, visitorId); assert.equal(memory.jobs.rows[0].userId, null);
  assert.equal(memory.jobs.rows[0].ownerId, `guest:${visitorId}`);
});
