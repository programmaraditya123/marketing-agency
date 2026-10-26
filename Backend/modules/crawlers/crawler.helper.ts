import { randomBytes } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import type { CrawlRepository } from "./crawler.repository";
import type { Scrape } from "../../types/crawler";
import { normalizeUrl, resolvePublic } from "./crawler.middleware";
import { scrapeWebsite } from "./crawler.scrape";
import { AppError } from "../../utils/app-error";
import type { Attribution } from "../../types/auth";
type Analyzer = (scrape: Scrape, signal: AbortSignal) => Promise<Record<string, unknown>>;
export function createCrawlService(repository: Pick<CrawlRepository, "get" | "insert" | "update">, analyze: Analyzer, log: FastifyBaseLogger, scrape = scrapeWebsite) {
  const active = new Set<Promise<void>>();
  let stopping = false;
  async function processJob(id: string, startUrl: string): Promise<void> {
    const deadline = AbortSignal.timeout(180000);
    try {
      await repository.update(id, { status: "crawling" });
      const data = await scrape(startUrl, AbortSignal.any([deadline, AbortSignal.timeout(75000)]));
      // Persist all raw evidence BEFORE calling Gemini.
      await repository.update(id, { scrape: data, status: "analyzing" });
      const saved = await repository.get(id);
      const analysis = await analyze(saved.scrape!, deadline);
      await repository.update(id, { status: "completed", analysis });
    } catch (error) {
      log.error({ jobId: id, errorType: error instanceof Error ? error.name : "Unknown" }, "Analysis job failed");
      await repository.update(id, { status: "failed", error: error instanceof AppError ? error.message : "Analysis could not finish. Please try again." });
    }
  }
  return {
    async create(value: string, ownerId?: string, context?: { parentAnalysisId: string; competitorId: string }, attribution?: Attribution) {
      const url = normalizeUrl(value);
      await resolvePublic(url);
      if (stopping) throw new AppError(503, "The service is shutting down. Please try again shortly.");
      if (active.size >= 2) throw new AppError(429, "Two analyses are already running. Please try again shortly.");
      const id = randomBytes(32).toString("hex");
      const createdAt = new Date().toISOString();
      // Reserve capacity before the asynchronous insert, including concurrent requests.
      let release!: () => void;
      const reservation = new Promise<void>(resolve => { release = resolve; });
      active.add(reservation);
      try {
        await repository.insert({ _id: id, ownerId, userId: attribution?.userId || null, visitorId: attribution?.visitorId || null, ...context, startUrl: url.href, status: "queued", createdAt, updatedAt: createdAt });
        void processJob(id, url.href).catch(() => log.error("Could not persist failed job status"))
          .finally(() => { active.delete(reservation); release(); });
      } catch (error) { active.delete(reservation); release(); throw error; }
      return { id, status: "queued" as const };
    },
    async get(id: string, ownerId?: string) {
      const job = await repository.get(id);
      if (ownerId && job.ownerId !== ownerId) throw new AppError(404, "Analysis not found.");
      return { id: job._id, startUrl: job.startUrl, status: job.status, createdAt: job.createdAt,
        parentAnalysisId: job.parentAnalysisId, competitorId: job.competitorId,
        updatedAt: job.updatedAt, error: job.error, analysis: job.analysis, brief: job.brief,
        totalPagesScraped: job.scrape?.pages.length || 0, socialLinks: job.scrape?.socialLinks || [],
        sources: job.scrape?.pages.map(({ url, title }) => ({ url, title })) || [], warnings: job.scrape?.warnings || [] };
    },
    async close() { stopping = true; await Promise.allSettled([...active]); },
  };
}
export type CrawlService = ReturnType<typeof createCrawlService>;
