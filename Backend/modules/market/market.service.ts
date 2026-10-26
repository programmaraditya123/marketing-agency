import type { CrawlRepository } from "../crawlers/crawler.repository";
import type { Environment } from "../../config/env";
import type { MarketResearch, TrendInput, TrendData, DemandAnalysis } from "../../types/market";
import { AppError } from "../../utils/app-error";
import type { WorkspaceService } from "../workspace/workspace.helper";
import type { Attribution } from "../../types/auth";

export function createMarketService(repository: CrawlRepository, env: Environment, workspace?: WorkspaceService) {
  const active = new Map<string, Promise<void>>();
  let stopping = false;
  async function owned(id: string, ownerId: string) {
    const job = await repository.get(id);
    if (job.ownerId !== ownerId) throw new AppError(404, "Analysis not found.");
    return job;
  }
  async function call<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${env.microserviceUrl}/api/v1/market/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
      body: JSON.stringify(body), signal: AbortSignal.timeout(150000),
    });
    if (!response.ok) throw new AppError(502, path === "collect" ? "Google Trends is unavailable, rate limited, or has no data. Try broader terms or retry later." : "Gemini interpretation failed. Collected trends remain saved; retry to analyze them.");
    return await response.json() as T;
  }
  async function save(id: string, state: MarketResearch) {
    state.updatedAt = new Date().toISOString();
    await repository.update(id, { marketResearch: structuredClone(state) });
  }
  async function process(id: string, website: string, business: unknown, state: MarketResearch) {
    try {
      if (!state.raw) state.raw = await call<TrendData>("collect", state.config);
      state.status = "analyzing";
      await save(id, state); // Commit evidence BEFORE paid Gemini interpretation.
      state.interpretation = await call<DemandAnalysis>("interpret", { website, business, data: state.raw });
      state.status = "completed"; await save(id, state);
    } catch (error) {
      state.status = "failed";
      state.error = error instanceof AppError ? error.message : "Market research could not finish. Any collected evidence is saved. Please retry.";
      await save(id, state);
    }
  }
  return {
    async get(id: string, ownerId: string) { return (await owned(id, ownerId)).marketResearch || null; },
    async start(id: string, ownerId: string, config: TrendInput, attribution?: Attribution) {
      config = { terms: [...new Set(config.terms.map(term => term.trim()))], geo: config.geo, timeframe: config.timeframe };
      const job = await owned(id, ownerId);
      if (job.status !== "completed") throw new AppError(409, "Complete the website analysis first.");
      if (active.has(id)) return job.marketResearch;
      if (stopping || active.size) throw new AppError(429, "Market research is busy. Please retry shortly.");
      const previous = job.marketResearch;
      if (previous?.raw && JSON.stringify(previous.config) !== JSON.stringify(config)) throw new AppError(409, "Collected evidence is saved for the original terms. Start a new website report to change them.");
      if (previous?.status === "completed") {
        if (JSON.stringify(previous.config) === JSON.stringify(config)) return previous;
        throw new AppError(409, "This report already has saved research. Start a new website report for different terms.");
      }
      const state: MarketResearch = { status: "collecting", config, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (previous?.raw && JSON.stringify(previous.config) === JSON.stringify(config)) state.raw = previous.raw;
      let release!: () => void;
      active.set(id, new Promise<void>(resolve => { release = resolve; }));
      try {
        await save(id, state);
        await workspace?.record(ownerId, "market_researched", config.terms.join(", "), id, attribution);
        void process(id, job.startUrl, job.analysis || null, structuredClone(state)).catch(() => undefined).finally(() => { active.delete(id); release(); });
      } catch (error) {
        state.status = "failed"; state.error = "Research could not start. Please retry.";
        try { await save(id, state); } finally { active.delete(id); release(); }
        throw error;
      }
      return state;
    },
    async close() { stopping = true; await Promise.allSettled(active.values()); },
  };
}
