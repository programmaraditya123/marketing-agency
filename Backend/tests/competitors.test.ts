import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { memoryStore } from "./helpers/memory-store";
import { createRepository } from "../modules/crawlers/crawler.repository";
import { createWorkspaceService } from "../modules/workspace/workspace.helper";
import { createCompetitorService } from "../modules/competitors/competitor.helper";
import { validateCompetitors } from "../modules/competitors/competitor.validate";
import { createCrawlService } from "../modules/crawlers/crawler.helper";
import { registerIdentity } from "../modules/auth/auth.middleware";
import { createAuthService } from "../modules/auth/auth.helper";
import { registerPlugins } from "../config/plugins";
import { registerErrorHandler } from "../config/error-handler";
import competitorRoutes from "../modules/competitors/competitor.routes";
import { AppError } from "../utils/app-error";
import type { Environment } from "../config/env";
import { createCompetitorGenerator } from "../config/competitors";
import type { CompetitorDiscovery } from "../types/competitor";

const id = "a".repeat(64), origin = "https://orbit.vidorahub.com";
const env: Environment = { port: 9000, host: "127.0.0.1", mongoUri: "", mongoDatabase: "test", microserviceUrl: "http://localhost:8000", serviceToken: "s".repeat(32), jwtSecret: "j".repeat(40), cookieSecure: false, cookieSameSite: "Lax", corsOrigins: [origin] };
const suggestions = { competitors: [{ name: "Rival company", website: "https://rival.com/", description: "Tools for independent teams." }] };

test("discovery makes exactly one authenticated suggestions call with the saved business context", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(String(url), "http://localhost:8000/api/v1/competitors/suggestions");
    assert.equal((options?.headers as Record<string, string>)["X-Service-Token"], env.serviceToken);
    assert.deepEqual(JSON.parse(String(options?.body)), { startUrl: "https://example.com", analysis: { company: {} } });
    return new Response(JSON.stringify(suggestions), { status: 200 });
  };
  const result = await createCompetitorGenerator(env)({ _id: id, startUrl: "https://example.com", analysis: { company: {} }, status: "completed", createdAt: "now", updatedAt: "now" }, AbortSignal.timeout(1000));
  assert.equal(calls, 1); assert.equal(result.results[0].title, "Rival company");
});

test("Gemini suggestions validate URLs, exclude own domain, deduplicate brands and cap results", () => {
  const item = (website: string) => ({ name: "Company", website, description: "A company offering relevant tools." });
  const output = validateCompetitors({ competitors: ["https://blog.own.co.uk/a", "https://www.rival.co.uk/a", "https://app.rival.co.uk/b", "http://127.0.0.1", "javascript:alert(1)", "http://localhost", "https://user:password@rival.com/", "https://rival.com:8080", "https://other.com"].map(item) }, "https://own.co.uk");
  assert.deepEqual(output.results.map(result => result.domain), ["rival.co.uk", "other.com"]);
  assert.equal(output.results[0].url, "https://www.rival.co.uk/");
  assert.ok(output.warnings.length);
  const ten = validateCompetitors({ competitors: Array.from({length:10}, (_, i) => item("https://rival" + i + ".com")) }, "https://own.co.uk");
  assert.equal(ten.results.length, 10); assert.deepEqual(ten.warnings, []);
  for (const bad of [{}, { competitors: [] }, { competitors: [item("https://127.0.0.1")] }, { competitors: [{ name: "No website" }] }]) assert.throws(() => validateCompetitors(bad, "https://own.co.uk"));
});

test("legacy Google results are replaced by Gemini suggestions without losing linked detailed reports", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection), app = Fastify();
  const candidate = validateCompetitors(suggestions, "https://example.com").results[0];
  await repository.insert({ _id: id, ownerId: "owner", startUrl: "https://example.com", status: "completed", analysis: {}, createdAt: "now", updatedAt: "now",
    competitors: { status: "completed", keywords: ["old query"], results: [candidate], warnings: [], updatedAt: "now" } as unknown as CompetitorDiscovery });
  await repository.insert({ _id: "b".repeat(64), ownerId: "owner", parentAnalysisId: id, competitorId: candidate.id, startUrl: candidate.url, status: "completed", createdAt: "now", updatedAt: "now" });
  const crawl = createCrawlService(repository, async () => ({}), app.log);
  let calls = 0;
  const service = createCompetitorService(repository, crawl, createWorkspaceService(memory.jobs.collection, memory.activities.collection), async () => {
    calls++; return validateCompetitors(suggestions, "https://example.com");
  }, app.log);
  t.after(async () => { await service.close(); await crawl.close(); await app.close(); });
  assert.equal(await service.get(id, "owner"), null);
  await assert.rejects(service.analyze(id, candidate.id, "owner"));
  await service.start(id, "owner"); await service.close();
  const result = await service.get(id, "owner");
  assert.equal(calls, 1); assert.equal(result?.provider, "gemini");
  assert.equal(result?.results[0].analysisId, "b".repeat(64));
});

test("owner-scoped discovery stores direct Gemini suggestions; detail actions are idempotent linked jobs with CSRF enforcement", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection), app = Fastify();
  await registerPlugins(app, env); registerErrorHandler(app);
  const store = { visitors: memory.visitors.collection, users: memory.users.collection, sessions: memory.sessions.collection, activities: memory.activities.collection, jobs: memory.jobs.collection };
  registerIdentity(app, createAuthService(store), env);
  app.get("/api/v1/auth/me", async req => ({ ownerId: req.identity.ownerId }));
  const crawl = createCrawlService(repository, async () => ({ company: {} }), app.log, async url => ({ startUrl: url, pages: [], socialLinks: [], warnings: [] }));
  let calls = 0;
  const service = createCompetitorService(repository, crawl, createWorkspaceService(store.jobs, store.activities), async job => {
    calls++;
    assert.equal((await repository.get(id)).competitors?.status, "generating");
    return validateCompetitors(suggestions, job.startUrl);
  }, app.log);
  t.after(async () => { await service.close(); await crawl.close(); await app.close(); });
  await app.register(competitorRoutes, { prefix: "/api/v1", service });
  const guest = await app.inject({ url: "/api/v1/auth/me" });
  const cookie = String(guest.headers["set-cookie"]).split(";")[0], ownerId = guest.json().ownerId;
  await repository.insert({ _id: id, ownerId, startUrl: "https://example.com", status: "completed", analysis: { company: {} }, createdAt: "now", updatedAt: "now" });
  const headers = { cookie, origin, "x-orbit-request": "1" };
  assert.equal((await app.inject({ method: "POST", url: `/api/v1/analyses/${id}/competitors`, headers: { cookie }, payload: {} })).statusCode, 403);
  const stranger = await app.inject({ url: `/api/v1/analyses/${id}/competitors` });
  assert.equal(stranger.statusCode, 404);
  const start = await app.inject({ method: "POST", url: `/api/v1/analyses/${id}/competitors`, headers, payload: {} });
  assert.equal(start.statusCode, 202);
  for (let i = 0; i < 30 && (await repository.get(id)).competitors?.status !== "completed"; i++) await new Promise(resolve => setTimeout(resolve, 10));
  const saved = (await app.inject({ url: `/api/v1/analyses/${id}/competitors`, headers })).json().data;
  assert.equal(saved.status, "completed"); assert.equal(saved.results[0].description, "Tools for independent teams.");
  assert.equal(saved.provider, "gemini"); assert.equal(saved.keywords, undefined); assert.equal(saved.results[0].sources, undefined);
  await service.start(id, ownerId); assert.equal(calls, 1);
  await assert.rejects(service.analyze(id, "f".repeat(24), ownerId));
  const parentRow = memory.jobs.rows.find(row => row._id === id)!; parentRow.competitors!.results[0].url = "https://8.8.8.8/";
  const detailUrl = `/api/v1/analyses/${id}/competitors/${saved.results[0].id}/analysis`;
  const [first, second] = await Promise.all([app.inject({ method: "POST", url: detailUrl, headers, payload: {} }), app.inject({ method: "POST", url: detailUrl, headers, payload: {} })]);
  assert.equal(first.statusCode, 202); assert.equal(second.json().data.id, first.json().data.id);
  const child = await repository.get(first.json().data.id);
  assert.equal(child.parentAnalysisId, id); assert.equal(child.ownerId, ownerId);
  assert.equal((await service.get(id, ownerId))?.results[0].analysisId, child._id);
  assert.ok(memory.activities.rows.some(event => event.type === "competitor_analyzed"));
});

test("failed Gemini requests are retryable without fabricated competitors", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection), app = Fastify();
  await repository.insert({ _id: id, ownerId: "owner", startUrl: "https://example.com", status: "completed", analysis: {}, createdAt: "now", updatedAt: "now" });
  const crawl = createCrawlService(repository, async () => ({}), app.log);
  let count = 0;
  const service = createCompetitorService(repository, crawl, createWorkspaceService(memory.jobs.collection, memory.activities.collection), async () => { count++; throw new AppError(503, "Gemini is unavailable. Please retry later."); }, app.log);
  t.after(async () => { await service.close(); await crawl.close(); await app.close(); });
  await service.start(id, "owner");
  for (let i = 0; i < 30 && (await repository.get(id)).competitors?.status !== "failed"; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual((await service.get(id, "owner"))?.results, []);
  await new Promise(resolve => setTimeout(resolve, 10));
  await service.start(id, "owner"); await service.close(); assert.equal(count, 2);
});
