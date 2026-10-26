import type { FastifyBaseLogger } from "fastify";
import type { CrawlRepository } from "../crawlers/crawler.repository";
import type { CrawlService } from "../crawlers/crawler.helper";
import type { WorkspaceService } from "../workspace/workspace.helper";
import type { CrawlJob } from "../../types/crawler";
import type { Competitor, CompetitorDiscovery } from "../../types/competitor";
import { AppError } from "../../utils/app-error";
import type { Attribution } from "../../types/auth";

type Generator = (job: CrawlJob, signal: AbortSignal) => Promise<{ results: Competitor[]; warnings: string[] }>;
export function createCompetitorService(repository: CrawlRepository, crawl: CrawlService, workspace: WorkspaceService, generate: Generator, log: FastifyBaseLogger) {
  const active = new Map<string, Promise<void>>();
  const details = new Map<string, Promise<{ id: string; status: string }>>();
  let stopping = false;
  async function owned(id: string, ownerId: string) {
    const job = await repository.get(id);
    if (job.ownerId !== ownerId) throw new AppError(404, "Analysis not found.");
    return job;
  }
  async function save(id: string, state: CompetitorDiscovery) {
    state.updatedAt = new Date().toISOString();
    await repository.update(id, { competitors: structuredClone(state) });
  }
  async function process(job: CrawlJob, state: CompetitorDiscovery) {
    const signal = AbortSignal.timeout(120000);
    try {
      state.status = "generating"; await save(job._id, state);
      const found = await generate(job, signal);
      state.results = found.results; state.warnings = found.warnings; state.status = "completed";
      await save(job._id, state);
    } catch (error) {
      log.error({ analysisId: job._id, errorType: error instanceof Error ? error.name : "Unknown" }, "Competitor discovery failed");
      state.status = "failed";
      state.error = error instanceof AppError ? error.message : "Gemini competitor suggestions could not finish. Please retry or check Microservice configuration.";
      await save(job._id, state);
    }
  }
  return {
    async get(id: string, ownerId: string) {
      const job = await owned(id, ownerId);
      if (!job.competitors || job.competitors.provider !== "gemini") return null;
      const children = await repository.children(id);
      return { ...job.competitors, results: job.competitors.results.map(result => ({ ...result,
        analysisId: children.find(child => child.competitorId === result.id)?._id })) };
    },
    async start(id: string, ownerId: string, attribution?: Attribution) {
      const job = await owned(id, ownerId);
      if (job.status !== "completed" || !job.analysis) throw new AppError(409, "Complete the website analysis before finding competitors.");
      if (job.competitors?.provider === "gemini" && job.competitors.status !== "failed") return job.competitors;
      if (stopping) throw new AppError(503, "The service is shutting down.");
      if (active.size) throw new AppError(429, "A competitor search is already running. Please try again shortly.");
      let release!: () => void;
      active.set(id, new Promise(resolve => { release = resolve; }));
      const state: CompetitorDiscovery = { provider: "gemini", status: "queued", results: [], warnings: [], updatedAt: new Date().toISOString() };
      try {
        await save(id, state);
        await workspace.record(ownerId, "competitors_searched", "Gemini competitor suggestions", id, attribution);
        void process(job, structuredClone(state)).catch(() => log.error("Could not persist competitor search failure"))
          .finally(() => { active.delete(id); release(); });
      } catch (error) { active.delete(id); release(); throw error; }
      return state;
    },
    async analyze(id: string, candidateId: string, ownerId: string, attribution?: Attribution) {
      const job = await owned(id, ownerId);
      const candidate = job.competitors?.results.find(result => result.id === candidateId);
      if (job.competitors?.provider !== "gemini" || job.competitors.status !== "completed" || !candidate) throw new AppError(404, "Competitor not found in this report.");
      const key = `${id}:${candidateId}`;
      const existing = details.get(key);
      if (existing) return existing;
      const task = (async () => {
        const saved = (await repository.children(id)).find(child => child.competitorId === candidateId);
        if (saved) return { id: saved._id, status: saved.status };
        const created = await crawl.create(candidate.url, ownerId, { parentAnalysisId: id, competitorId: candidateId }, attribution);
        await workspace.record(ownerId, "competitor_analyzed", candidate.domain, created.id, attribution);
        return created;
      })();
      details.set(key, task);
      try { return await task; } finally { details.delete(key); }
    },
    async close() { stopping = true; await Promise.allSettled([...active.values(), ...details.values()]); },
  };
}
export type CompetitorService = ReturnType<typeof createCompetitorService>;
