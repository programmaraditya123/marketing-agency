import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { memoryStore } from "./helpers/memory-store";
import { createRepository } from "../modules/crawlers/crawler.repository";
import { createContentService } from "../modules/content/content.service";
import { createWorkspaceService } from "../modules/workspace/workspace.helper";
import { createAuthService } from "../modules/auth/auth.helper";
import { registerIdentity } from "../modules/auth/auth.middleware";
import { registerPlugins } from "../config/plugins";
import { registerErrorHandler } from "../config/error-handler";
import contentRoutes from "../modules/content/content.routes";
import type { Environment } from "../config/env";
import type { ContentStrategy } from "../types/content";

const id = "c".repeat(64);
const env: Environment = {
  port: 9000,
  host: "127.0.0.1",
  mongoUri: "",
  mongoDatabase: "test",
  microserviceUrl: "http://micro.test",
  serviceToken: "s".repeat(32),
  jwtSecret: "j".repeat(40),
  cookieSecure: false,
  cookieSameSite: "Lax",
  corsOrigins: ["https://orbit.vidorahub.com"],
};

const mockStrategy: ContentStrategy = {
  summary: "Focus on LinkedIn and YouTube tutorials.",
  targetAudienceInsights: "B2B professionals browsing in morning commute.",
  platforms: [
    {
      platform: "LinkedIn",
      priority: "primary",
      why: "B2B audience concentration",
      postingCadence: "3 posts / week",
      bestDays: ["Tuesday", "Thursday"],
      bestTimeWindows: ["08:00 - 10:00 AM"],
      timeRationale: "Pre-work browsing",
      recommendedFormats: ["Carousels", "Short videos"],
    },
  ],
  contentPillars: [
    {
      name: "How-To Guides",
      allocationPercent: 50,
      goal: "Educational authority",
      contentTypes: ["Step-by-step guides"],
      examplePostIdeas: ["5 ways to automate marketing"],
    },
    {
      name: "Case Studies",
      allocationPercent: 50,
      goal: "Social proof",
      contentTypes: ["Customer stories"],
      examplePostIdeas: ["How Company X scaled 3x"],
    },
  ],
  weeklySchedule: [
    {
      day: "Tuesday",
      platform: "LinkedIn",
      timeSlot: "08:30 AM",
      pillar: "How-To Guides",
      contentType: "Carousel",
      topic: "Automate your workflows",
      hook: "Stop doing manual data entry in 2026.",
      callToAction: "Save this post for later.",
    },
  ],
  growthTips: ["Comment on top industry posts before posting."],
};

test("content service starts generation, handles provider failure, and caches completed strategy", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection);
  const service = createContentService(repository, env, createWorkspaceService(memory.jobs.collection, memory.activities.collection));
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const attribution = { userId: "user-content", visitorId: "visitor-content" };

  await repository.insert({
    _id: id,
    ownerId: "user:one",
    ...attribution,
    startUrl: "https://example.com",
    status: "completed",
    analysis: { company: { name: { value: "Test Brand" } } },
    createdAt: "now",
    updatedAt: "now",
  });

  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(String(url), "http://micro.test/api/v1/content/strategy");
    const input = JSON.parse(String(options?.body));
    assert.equal(input.website, "https://example.com");
    assert.deepEqual(input.business, { company: { name: { value: "Test Brand" } } });
    assert.equal((options?.headers as Record<string, string>)["X-Service-Token"], env.serviceToken);
    return calls === 2 ? new Response("", { status: 502 }) : Response.json(mockStrategy);
  };

  await assert.rejects(service.start(id, "user:other", attribution), /not found/);
  await service.start(id, "user:one", attribution, "lead_gen");
  await service.close();

  const saved = await service.get(id, "user:one");
  assert.equal(saved?.status, "completed");
  assert.equal(saved?.result?.platforms[0].platform, "LinkedIn");
  assert.equal(saved?.focusGoal, "lead_gen");

  // Re-running with same focusGoal uses cache
  const second = createContentService(repository, env, createWorkspaceService(memory.jobs.collection, memory.activities.collection));
  await second.start(id, "user:one", attribution, "lead_gen");
  assert.equal(calls, 1);

  // Re-running with different focusGoal triggers new call
  await second.start(id, "user:one", attribution, "brand_awareness");
  await second.close();
  const failed = await second.get(id, "user:one");
  assert.equal(failed?.status, "failed");
  assert.equal(calls, 2);
});

test("content API enforces CSRF, identity scoping, and returns 202 on generation", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection), app = Fastify();
  await registerPlugins(app, env);
  registerErrorHandler(app);
  registerIdentity(
    app,
    createAuthService({
      jobs: memory.jobs.collection,
      activities: memory.activities.collection,
      users: memory.users.collection,
      visitors: memory.visitors.collection,
      sessions: memory.sessions.collection,
    }),
    env
  );

  app.get("/api/v1/auth/me", async req => req.identity);
  const service = createContentService(repository, env, createWorkspaceService(memory.jobs.collection, memory.activities.collection));
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(mockStrategy);
  t.after(async () => {
    await service.close();
    await app.close();
    globalThis.fetch = original;
  });

  await app.register(contentRoutes, { prefix: "/api/v1", service });

  const guest = await app.inject({ url: "/api/v1/auth/me" }), identity = guest.json();
  const setCookie = guest.headers["set-cookie"];
  const cookie = (Array.isArray(setCookie) ? setCookie : [String(setCookie)]).map(item => item.split(";")[0]).join("; ");

  await repository.insert({
    _id: id,
    ownerId: identity.ownerId,
    userId: null,
    visitorId: identity.visitorId,
    startUrl: "https://example.com",
    status: "completed",
    analysis: {},
    createdAt: "now",
    updatedAt: "now",
  });

  const url = `/api/v1/analyses/${id}/content-strategy`;
  const headers = { cookie, origin: "https://orbit.vidorahub.com", "x-orbit-request": "1" };

  // GET without completed strategy returns null data
  const initialGet = await app.inject({ url, headers });
  assert.equal(initialGet.statusCode, 200);
  assert.equal(initialGet.json().data, null);

  // POST without CSRF headers fails
  assert.equal((await app.inject({ method: "POST", url, headers: { cookie }, payload: {} })).statusCode, 403);

  // POST with valid CSRF starts generation
  const postRes = await app.inject({ method: "POST", url, headers, payload: { focusGoal: "growth" } });
  assert.equal(postRes.statusCode, 202);
  assert.equal(postRes.json().data.status, "generating");

  await service.close();

  const finalGet = await app.inject({ url, headers });
  assert.equal(finalGet.json().data.status, "completed");
  assert.equal(finalGet.json().data.result.platforms[0].platform, "LinkedIn");

  const activity = memory.activities.rows.find(row => row.type === "content_strategy_generated");
  assert.ok(activity);
  assert.equal(activity?.ownerId, identity.ownerId);
});
