import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { createHmac } from "node:crypto";
import { createJwt } from "../config/jwt";
import { registerPlugins } from "../config/plugins";
import { registerRoutes } from "../config/routes";
import { registerErrorHandler } from "../config/error-handler";
import { createAuthService } from "../modules/auth/auth.helper";
import { registerIdentity } from "../modules/auth/auth.middleware";
import { createWorkspaceService } from "../modules/workspace/workspace.helper";
import { createRepository } from "../modules/crawlers/crawler.repository";
import { createCrawlService } from "../modules/crawlers/crawler.helper";
import { hashPassword, verifyPassword } from "../modules/auth/auth.password";
import { memoryStore } from "./helpers/memory-store";
import type { Environment } from "../config/env";
const env: Environment = { port: 9000, host: "127.0.0.1", mongoUri: "", mongoDatabase: "test", microserviceUrl: "http://127.0.0.1:8000", serviceToken: "service-test".repeat(4), jwtSecret: "auth-test".repeat(8), cookieSecure: true, cookieSameSite: "Lax", corsManagedByCatalyst: false, corsOrigins: ["https://orbit.test"] };
const writeHeaders = { "x-orbit-request": "1", origin: "https://orbit.test" };
async function setup(platformCors = false) {
  const memory = memoryStore();
  const store = { users: memory.users.collection, sessions: memory.sessions.collection, activities: memory.activities.collection, jobs: memory.jobs.collection };
  const app = Fastify();
  await registerPlugins(app, { ...env, corsManagedByCatalyst: platformCors }); registerErrorHandler(app);
  const auth = createAuthService(store), workspace = createWorkspaceService(store.jobs, store.activities);
  registerIdentity(app, auth, env);
  const service = createCrawlService(createRepository(store.jobs), async () => ({ company: {} }), app.log,
    async () => ({ startUrl: "https://8.8.8.8/", pages: [], socialLinks: [], warnings: [] }));
  await registerRoutes(app, service, async () => {}, { auth, workspace, env });
  app.addHook("onClose", async () => { await service.close(); });
  return { app, memory, service };
}
function cookie(response: { headers: Record<string, unknown> }) { return String(response.headers["set-cookie"]).split(";")[0]; }
const account = { email: "owner@example.com", password: "twelve-plus-characters", name: "Owner" };

test("JWT rejects tampering, wrong keys, expiry, algorithms, issuer and audience", () => {
  const jwt = createJwt(env.jwtSecret), sid = "a".repeat(64), token = jwt.issue(sid);
  assert.equal(jwt.verify(token), sid);
  assert.throws(() => jwt.verify(token + "broken"));
  assert.throws(() => createJwt("another-key").verify(token));
  assert.throws(() => jwt.verify(jwt.issue(sid, -1)));
  for (const change of [{ aud: "wrong" }, { iss: "wrong" }, { exp: "never" }, { sub: "invalid" }]) {
    const [header] = token.split(".");
    const body = Buffer.from(JSON.stringify({ sub: sid, iss: "orbit", aud: "orbit-api", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60, ...change })).toString("base64url");
    const unsigned = `${header}.${body}`;
    assert.throws(() => jwt.verify(`${unsigned}.${createHmac("sha256", env.jwtSecret).update(unsigned).digest("base64url")}`));
  }
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url"), body = token.split(".")[1], unsigned = `${header}.${body}`;
  assert.throws(() => jwt.verify(`${unsigned}.${createHmac("sha256", env.jwtSecret).update(unsigned).digest("base64url")}`));
});
test("passwords use salted scrypt and constant-time verification", async () => {
  const hash = await hashPassword(account.password);
  assert.ok(!hash.includes(account.password));
  assert.notEqual(hash, await hashPassword(account.password));
  assert.equal(await verifyPassword(account.password, hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});
test("guest searches, report access, notes and activity are isolated and claimed on signup", async t => {
  const { app, memory, service } = await setup(); t.after(() => app.close());
  const bootstrap = await app.inject({ url: "/api/v1/auth/me" });
  assert.equal(bootstrap.statusCode, 200); assert.equal(bootstrap.json().data.user, null);
  assert.match(String(bootstrap.headers["set-cookie"]), /HttpOnly; SameSite=Lax/);
  assert.match(String(bootstrap.headers["set-cookie"]), /Secure/);
  const guest = cookie(bootstrap);
  const created = await app.inject({ method: "POST", url: "/api/v1/analyses", headers: { ...writeHeaders, cookie: guest }, payload: { startUrl: "https://8.8.8.8/" } });
  assert.equal(created.statusCode, 202); const id = created.json().data.id; await service.close();
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: { cookie: guest } })).statusCode, 200);
  const stranger = cookie(await app.inject({ url: "/api/v1/auth/me" }));
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: { cookie: stranger } })).statusCode, 404);
  assert.deepEqual((await app.inject({ url: "/api/v1/history", headers: { cookie: stranger } })).json().data.items, []);
  const brief = { product: "A real product", audience: "Founders", pastSteps: "Email launch", futurePlans: "Customer interviews", goals: "Learn" };
  assert.equal((await app.inject({ method: "POST", url: `/api/v1/analyses/${id}/brief`, headers: { ...writeHeaders, cookie: stranger }, payload: brief })).statusCode, 404);
  assert.equal((await app.inject({ method: "POST", url: `/api/v1/analyses/${id}/brief`, headers: { ...writeHeaders, cookie: guest }, payload: brief })).statusCode, 200);
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: { cookie: guest } })).json().data.brief.pastSteps, brief.pastSteps);
  const registered = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { ...writeHeaders, cookie: guest }, payload: account });
  assert.equal(registered.statusCode, 201); const owner = cookie(registered);
  assert.notEqual(owner, guest); assert.equal(registered.json().data.user.email, account.email);
  assert.equal(registered.json().data.user.passwordHash, undefined);
  assert.equal((await app.inject({ url: "/api/v1/history", headers: { cookie: owner } })).json().data.items.length, 1);
  const activity = (await app.inject({ url: "/api/v1/activity", headers: { cookie: owner } })).json().data.items;
  assert.ok(activity.some((event: { type: string }) => event.type === "website_searched"));
  assert.ok(activity.some((event: { type: string }) => event.type === "brief_updated"));
  assert.equal(activity[0].ownerId, undefined);
  assert.ok(memory.jobs.rows.every(job => job.ownerId === `user:${registered.json().data.user.id}`));
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: { cookie: guest } })).statusCode, 401);
  const bearer = { authorization: `Bearer ${registered.json().data.accessToken}` };
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: bearer })).statusCode, 200);
  const loggedOut = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { ...writeHeaders, cookie: owner }, payload: {} });
  assert.equal(loggedOut.statusCode, 200);
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: bearer })).statusCode, 401);
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: { cookie: cookie(loggedOut) } })).statusCode, 404);
  const signedIn = await app.inject({ method: "POST", url: "/api/v1/auth/login", headers: { ...writeHeaders, cookie: cookie(loggedOut) }, payload: { email: "OWNER@example.com", password: account.password } });
  assert.equal(signedIn.statusCode, 200);
  assert.equal((await app.inject({ url: `/api/v1/analyses/${id}`, headers: { cookie: cookie(signedIn) } })).statusCode, 200);
});
test("CSRF, input validation, expired cookies, invalid bearer tokens and CORS", async t => {
  const { app } = await setup(); t.after(() => app.close());
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: account })).statusCode, 403);
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { ...writeHeaders, origin: "https://evil.test" }, payload: account })).statusCode, 403);
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: writeHeaders, payload: { ...account, password: "short" } })).statusCode, 400);
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: writeHeaders, payload: { ...account, name: "   " } })).statusCode, 400);
  assert.equal((await app.inject({ url: "/api/v1/auth/me", headers: { authorization: "Bearer invalid" } })).statusCode, 401);
  const old = `orbit_session=${createJwt(env.jwtSecret).issue("f".repeat(64), -1)}`;
  assert.equal((await app.inject({ url: "/api/v1/auth/me", headers: { cookie: old } })).statusCode, 200);
  assert.equal((await app.inject({ url: "/api/v1/history", headers: { cookie: old } })).statusCode, 401);
  const response = await app.inject({ method: "OPTIONS", url: "/api/v1/auth/login", headers: { origin: "https://orbit.test", "access-control-request-method": "POST", "access-control-request-headers": "x-orbit-request,content-type" } });
  assert.equal(response.statusCode, 204); assert.equal(response.headers["access-control-allow-credentials"], "true");
});
test("platform-managed CORS retains JWT and CSRF enforcement without duplicate headers", async t => {
  const { app } = await setup(true); t.after(() => app.close());
  const token = await app.inject({ url: "/api/v1/history", headers: { origin: "https://orbit.test", authorization: "Bearer invalid" } });
  assert.equal(token.statusCode, 401);
  assert.equal(token.headers["access-control-allow-origin"], undefined);
  const csrf = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { ...writeHeaders, origin: "https://evil.test" }, payload: account });
  assert.equal(csrf.statusCode, 403);
});
test("history and activity paginate without skipping records with identical timestamps", async t => {
  const { app, memory } = await setup(); t.after(() => app.close());
  const guest = cookie(await app.inject({ url: "/api/v1/auth/me" }));
  const ownerId = memory.sessions.rows[0].ownerId;
  const createdAt = "2026-10-26T00:00:00.000Z";
  for (let index = 1; index <= 51; index++) {
    memory.jobs.rows.push({ _id: index.toString(16).padStart(64, "0"), ownerId, startUrl: "https://example.com/", status: "completed", createdAt, updatedAt: createdAt });
    memory.activities.rows.push({ _id: index.toString(16).padStart(32, "0"), ownerId, type: "section_viewed", detail: "Your Product", createdAt: new Date(createdAt), expiresAt: new Date("2027-01-01") });
  }
  for (const route of ["history", "activity"]) {
    const first = (await app.inject({ url: `/api/v1/${route}`, headers: { cookie: guest } })).json().data;
    assert.equal(first.items.length, 50); assert.ok(first.nextCursor);
    const second = (await app.inject({ url: `/api/v1/${route}?before=${first.nextCursor}`, headers: { cookie: guest } })).json().data;
    assert.equal(second.items.length, 1); assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 51);
    assert.equal((await app.inject({ url: `/api/v1/${route}?before=invalid`, headers: { cookie: guest } })).statusCode, 400);
  }
});
