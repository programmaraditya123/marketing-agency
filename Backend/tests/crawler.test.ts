import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import type { CrawlJob, Scrape } from "../types/crawler";
import { createCrawlService } from "../modules/crawlers/crawler.helper";
import { isPublicAddress, normalizeUrl, resolvePublic } from "../modules/crawlers/crawler.middleware";
import { extractPage } from "../modules/crawlers/crawler.extract";
import { robotsAllows } from "../modules/crawlers/crawler.scrape";
import crawlerRoutes from "../modules/crawlers/crawlers.route";
import { registerErrorHandler } from "../config/error-handler";

test("rejects private, reserved, and mapped addresses", async () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "192.168.1.1", "169.254.169.254", "::1", "::ffff:127.0.0.1", "fc00::1", "100.64.0.1"]) assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  await assert.rejects(resolvePublic(new URL("http://127.0.0.1")));
  assert.throws(() => normalizeUrl("https://user:pass@example.com"));
  assert.throws(() => normalizeUrl("http://example.com:8000"));
  assert.equal(normalizeUrl("example.com").href, "https://example.com/");
});
test("extracts public social links and product evidence, ignoring scripts and malformed links", () => {
  const { page, links, socialLinks } = extractPage('<title>Acme</title><body><h1>Our product</h1><script>secret script</script><a href="/products">Products</a><a href="https://instagram.com/acme">Social</a><a href="https://instagram.com.evil.test/acme">Fake</a><a href="http://[">Bad</a></body>', "https://example.com/");
  assert.equal(page.title, "Acme");
  assert.ok(!page.mainText.includes("secret script"));
  assert.deepEqual(links, ["https://example.com/products"]);
  assert.equal(socialLinks.length, 1);
  assert.equal(socialLinks[0].platform, "Instagram");
});
test("respects robots disallow, longest allow rule and bot-specific groups", () => {
  const allowed = robotsAllows("User-agent: *\nDisallow: /private\nAllow: /private/public\n");
  assert.equal(allowed("/private/page"), false);
  assert.equal(allowed("/private/public/page"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /\nUser-agent: BrandLensBot\nAllow: /")("/products"), true);
});
test("raw scrape is persisted before analysis; failure preserves evidence", async () => {
  const events: string[] = [];
  let saved: CrawlJob;
  const data: Scrape = { startUrl: "https://example.com/", pages: [], socialLinks: [], warnings: [] };
  const repository = {
    async insert(job: CrawlJob) { saved = job; },
    async get() { return saved; },
    async update(_id: string, patch: Partial<CrawlJob>) { events.push(patch.status!); saved = { ...saved, ...patch }; },
  };
  const app = Fastify();
  const service = createCrawlService(repository, async () => { assert.equal(saved.scrape, data); events.push("provider"); throw new Error("provider error containing a secret"); }, app.log, async () => data);
  // Use public numeric IP to test the pipeline without external DNS or HTTP calls.
  const job = await service.create("https://8.8.8.8/");
  await service.close();
  assert.deepEqual(events, ["crawling", "analyzing", "provider", "failed"]);
  assert.equal(saved!.scrape, data);
  assert.ok(!saved!.error?.includes("secret"));
  assert.equal((await service.get(job.id)).status, "failed");
  await app.close();
});
test("API validates input and preserves asynchronous legacy endpoint", async () => {
  const app = Fastify();
  registerErrorHandler(app);
  let called = 0;
  const service = {
    async create() { called++; return { id: "a".repeat(64), status: "queued" as const }; },
    async get() { return { id: "a".repeat(64), startUrl: "https://example.com/", status: "completed" as const,
      createdAt: "2026-10-21", updatedAt: "2026-10-21", error: undefined, analysis: { company: { name: { value: "Acme" } } },
      totalPagesScraped: 1, socialLinks: [], sources: [{ url: "https://example.com/", title: "Acme" }], warnings: [],
      scrape: { privateRawText: "raw evidence" } }; },
    async close() {},
  };
  await app.register(crawlerRoutes, { prefix: "/api/v1", service });
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/analyses", payload: {} })).statusCode, 400);
  assert.equal(called, 0);
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/crawlwebsite", payload: { startUrl: "example.com" } })).statusCode, 202);
  assert.equal((await app.inject({ url: "/api/v1/analyses/not-an-id" })).statusCode, 400);
  const result = await app.inject({ url: `/api/v1/analyses/${"a".repeat(64)}` });
  assert.equal(result.statusCode, 200);
  assert.equal(result.json().data.analysis.company.name.value, "Acme");
  assert.equal(result.json().data.scrape, undefined);
  await app.close();
});
