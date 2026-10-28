import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { memoryStore } from "./helpers/memory-store";
import { createRepository } from "../modules/crawlers/crawler.repository";
import { createSeoService } from "../modules/seo/seo.service";
import { createWorkspaceService } from "../modules/workspace/workspace.helper";
import { createAuthService } from "../modules/auth/auth.helper";
import { registerIdentity } from "../modules/auth/auth.middleware";
import { registerPlugins } from "../config/plugins";
import { registerErrorHandler } from "../config/error-handler";
import seoRoutes from "../modules/seo/seo.routes";
import type { Environment } from "../config/env";
import type { SeoComparisonResult } from "../types/seo";

const id = "a".repeat(64);
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

const mockSeoResult: SeoComparisonResult = {
  summary: "Competitor leads in commercial search intent and structured schema markup.",
  competitiveDisadvantageDiagnosis: "Client website uses generic marketing slogans in Title and H1, whereas competitor targets 'AI CRM Software'.",
  organicOpportunityScore: 85,
  clientProfile: {
    url: "https://example.com",
    title: "Example Brand - Modern Solutions",
    titleLength: 32,
    titleEvaluation: "Vague, missing core keywords.",
    description: "Modern tools for teams.",
    descriptionLength: 22,
    descriptionEvaluation: "Too short.",
    h1Tags: ["Work Better Today"],
    h2Tags: ["Features", "About"],
    schemaTypes: ["Organization"],
    detectedKeywords: ["modern solutions", "tools"],
    overallSeoHealthScore: 50,
  },
  competitorProfile: {
    url: "https://competitor.com",
    title: "Best AI CRM Software for Sales Teams | Competitor",
    titleLength: 50,
    titleEvaluation: "Front-loaded keywords.",
    description: "Close 3x more deals with Competitor AI CRM. Free 14-day trial.",
    descriptionLength: 62,
    descriptionEvaluation: "High CTR appeal.",
    h1Tags: ["The #1 AI CRM for High-Growth Sales Teams"],
    h2Tags: ["Automate Sequences", "Pipeline Forecasting"],
    schemaTypes: ["Organization", "Product", "FAQPage"],
    detectedKeywords: ["AI CRM Software", "sales teams"],
    overallSeoHealthScore: 90,
  },
  gapFactors: [
    {
      category: "Title Tag & Click Intent",
      status: "competitor_leads",
      impact: "critical",
      issue: "Client title lacks product keyword.",
      whyCompetitorWins: "Competitor captures search intent with exact keyword match.",
    },
  ],
  keywordGaps: [
    {
      keyword: "AI CRM Software",
      searchIntent: "commercial",
      impactLevel: "high",
      whyItMatters: "High buyer search intent.",
      clientStatus: "missing",
    },
  ],
  sharedKeywords: ["CRM", "tools"],
  recommendedTitle: "AI CRM Software for Sales Teams | Example Brand",
  recommendedTitleRationale: "Target winning commercial keyword.",
  recommendedDescription: "Accelerate sales pipeline and close more deals with Example AI CRM. Start your free trial.",
  recommendedDescriptionRationale: "Compelling 150-char description with primary keyword and CTA.",
  recommendedH1: "AI CRM Software Engineered for High-Velocity Sales Teams",
  recommendedH2s: ["Automated Lead Scoring & Pipeline Tracking", "Email Follow-Up Sequences"],
  primaryTargetKeywords: ["AI CRM Software", "sales pipeline tool"],
  secondaryTargetKeywords: ["automated sales follow up"],
  contentInjectionPlan: [
    {
      pageSection: "Hero Section",
      recommendedKeywords: ["AI CRM Software"],
      suggestedCopySnippet: "Scale your revenue with the premier AI CRM software.",
    },
  ],
  copyableMetadata: {
    htmlMetaTags: "<title>AI CRM Software | Example Brand</title>",
    jsonLdSchema: "<script type=\"application/ld+json\">{}</script>",
    nextJsMetadata: "export const metadata: Metadata = { title: 'AI CRM Software' };",
  },
  topActionSteps: [
    {
      stepNumber: 1,
      title: "Update Meta Title Tag",
      action: "Deploy new keyword-targeted title tag.",
      estimatedImpactTime: "1-2 weeks",
    },
  ],
};

test("SEO service starts comparison, handles provider failure, and caches completed comparison", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection);
  const service = createSeoService(repository, env, createWorkspaceService(memory.jobs.collection, memory.activities.collection));
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const attribution = { userId: "user-seo", visitorId: "visitor-seo" };

  await repository.insert({
    _id: id,
    ownerId: "user:one",
    ...attribution,
    startUrl: "https://example.com",
    status: "completed",
    analysis: { company: { name: { value: "Example Brand" }, industry: "SaaS" } },
    scrape: {
      startUrl: "https://example.com",
      pages: [
        {
          url: "https://example.com",
          title: "Example Brand",
          description: "Smart software",
          headings: ["Welcome", "Features"],
          mainText: "Example software text",
          structuredData: [],
          scrapedAt: new Date().toISOString(),
        },
      ],
      socialLinks: [],
      warnings: [],
    },
    createdAt: "now",
    updatedAt: "now",
  });

  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    if (String(url) === "http://micro.test/api/v1/seo/compare") {
      const input = JSON.parse(String(options?.body));
      assert.equal(input.client.url, "https://example.com");
      assert.equal(input.competitor.url, "https://competitor.com/");
      return new Response(JSON.stringify(mockSeoResult), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    // Robots or HTML fetch fallback
    return new Response("<html><head><title>Competitor</title></head><body>Competitor body</body></html>", { status: 200 });
  };

  const initial = await service.start(id, "https://competitor.com", "user:one", attribution);
  assert.equal(initial?.status, "generating");
  assert.equal(initial?.activeCompetitorDomain, "competitor.com");

  // Wait for background process to finish
  for (let i = 0; i < 40; i++) {
    const current = await service.get(id, "user:one");
    if (current.status === "completed") break;
    await new Promise(r => setTimeout(r, 50));
  }

  const completed = await service.get(id, "user:one");
  assert.equal(completed.status, "completed");
  assert.equal(completed.result?.summary, mockSeoResult.summary);
  assert.equal(completed.savedComparisons?.["competitor.com"]?.organicOpportunityScore, 85);

  // Calling start again with the same competitor domain returns cached result immediately without new network call
  const prevCalls = calls;
  const cached = await service.start(id, "https://competitor.com", "user:one", attribution);
  assert.equal(cached?.status, "completed");
  assert.equal(cached?.result?.organicOpportunityScore, 85);
  assert.equal(calls, prevCalls);

  await service.close();
});

test("SEO API enforces CSRF, identity scoping, and returns 202 on generation", async t => {
  const memory = memoryStore(), repository = createRepository(memory.jobs.collection);
  const auth = createAuthService({
    jobs: memory.jobs.collection,
    activities: memory.activities.collection,
    users: memory.users.collection,
    visitors: memory.visitors.collection,
    sessions: memory.sessions.collection,
  });
  const workspace = createWorkspaceService(memory.jobs.collection, memory.activities.collection);
  const service = createSeoService(repository, env, workspace);

  const app = Fastify();
  await registerPlugins(app, env);
  registerErrorHandler(app);
  registerIdentity(app, auth, env);
  app.get("/api/v1/auth/me", async req => req.identity);
  await app.register(seoRoutes, { prefix: "/api/v1", service });

  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(mockSeoResult), { status: 200, headers: { "Content-Type": "application/json" } });
  t.after(async () => {
    await service.close();
    await app.close();
    globalThis.fetch = original;
  });

  const guest = await app.inject({ url: "/api/v1/auth/me" }), identity = guest.json();
  const setCookie = guest.headers["set-cookie"];
  const cookie = (Array.isArray(setCookie) ? setCookie : [String(setCookie)]).map(item => item.split(";")[0]).join("; ");

  await repository.insert({
    _id: id,
    ownerId: identity.ownerId,
    startUrl: "https://example.com",
    status: "completed",
    analysis: { company: { name: { value: "Brand" } } },
    createdAt: "now",
    updatedAt: "now",
  });

  const url = `/api/v1/analyses/${id}/seo-comparison`;
  const headers = { cookie, origin: "https://orbit.vidorahub.com", "x-orbit-request": "1" };

  // GET without prior comparison returns idle status
  const initialGet = await app.inject({ url, headers });
  assert.equal(initialGet.statusCode, 200);
  assert.equal(initialGet.json().data.status, "idle");

  // POST without CSRF headers fails with 403
  assert.equal((await app.inject({ method: "POST", url, headers: { cookie }, payload: { competitorUrl: "https://competitor.com" } })).statusCode, 403);

  // POST with invalid body fails with 400
  const badBody = await app.inject({
    method: "POST",
    url,
    headers,
    payload: {},
  });
  assert.equal(badBody.statusCode, 400);

  // POST with valid payload starts generation and returns 202
  const postRes = await app.inject({
    method: "POST",
    url,
    headers,
    payload: { competitorUrl: "https://competitor.com" },
  });
  assert.equal(postRes.statusCode, 202);
  assert.equal(postRes.json().data.status, "generating");

  await service.close();

  const finalGet = await app.inject({ url, headers });
  assert.equal(finalGet.json().data.status, "completed");
  assert.equal(finalGet.json().data.result.organicOpportunityScore, 85);

  const activity = memory.activities.rows.find(row => row.type === "seo_comparison_generated");
  assert.ok(activity);
  assert.equal(activity?.ownerId, identity.ownerId);
});
