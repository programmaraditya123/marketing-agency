import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import type { CrawlJob } from "../types/crawler";
import { createCrawlService } from "../modules/crawlers/crawler.helper";
import { sameWebsite } from "../modules/crawlers/crawler.fetch";

test("accepts canonical www/HTTPS redirects, rejects unrelated hosts and downgrades", () => {
  assert.equal(sameWebsite(new URL("https://www.example.com/a"), "https://example.com"), true);
  assert.equal(sameWebsite(new URL("https://example.com"), "http://example.com"), true);
  assert.equal(sameWebsite(new URL("https://example.com.evil.test"), "https://example.com"), false);
  assert.equal(sameWebsite(new URL("http://example.com"), "https://example.com"), false);
});

test("completes a job, saves the analysis and excludes raw page text from the public report", async () => {
  const records = new Map<string, CrawlJob>();
  const repository = {
    async insert(job: CrawlJob) { records.set(job._id, job); },
    async get(id: string) { return records.get(id)!; },
    async update(id: string, patch: Partial<CrawlJob>) { records.set(id, { ...records.get(id)!, ...patch }); },
  };
  const app = Fastify();
  const service = createCrawlService(repository, async data => {
    assert.equal([...records.values()][0].scrape, data);
    return { company: { name: "Acme" }, targetAudience: [] };
  }, app.log, async startUrl => ({ startUrl, pages: [{ url: startUrl, title: "Acme", mainText: "Original evidence", description: "", headings: [], structuredData: [], scrapedAt: new Date().toISOString() }], socialLinks: [], warnings: [] }));
  const created = await service.create("https://8.8.8.8/");
  await service.close();
  const report = await service.get(created.id);
  assert.equal(report.status, "completed");
  assert.equal(report.totalPagesScraped, 1);
  assert.equal(report.sources[0].title, "Acme");
  assert.ok(!JSON.stringify(report).includes("Original evidence"));
  await assert.rejects(service.create("https://8.8.8.8/"), /shutting down/);
  await app.close();
});
