import type { CrawlRepository } from "../crawlers/crawler.repository";
import type { WorkspaceService } from "../workspace/workspace.helper";
import type { Environment } from "../../config/env";
import type { Attribution } from "../../types/auth";
import type { MarketingBudget, MarketingPlan, MarketingState } from "../../types/marketing";
import { AppError } from "../../utils/app-error";
export function createMarketingService(repository: CrawlRepository, env: Environment, workspace: WorkspaceService) {
  const active = new Map<string, Promise<void>>();
  let stopping = false;
  async function owned(id: string, ownerId: string) {
    const job = await repository.get(id);
    if (job.ownerId !== ownerId) throw new AppError(404, "Analysis not found.");
    return job;
  }
  async function save(id: string, state: MarketingState) {
    state.updatedAt = new Date().toISOString();
    await repository.update(id, { marketingPlan: structuredClone(state) });
  }
  async function process(job: Awaited<ReturnType<typeof owned>>, state: MarketingState) {
    try {
      const response = await fetch(`${env.microserviceUrl}/api/v1/marketing/channels`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
        body: JSON.stringify({ website: job.startUrl, business: job.analysis, budget: state.budget, trends: job.marketResearch?.raw || null }),
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error("Provider failed");
      state.result = await response.json() as MarketingPlan;
      state.status = "completed"; await save(job._id, state);
    } catch {
      state.status = "failed"; state.error = "Marketing recommendations could not finish. Your budget is saved; please retry.";
      await save(job._id, state);
    }
  }
  return {
    async get(id: string, ownerId: string) { return (await owned(id, ownerId)).marketingPlan || null; },
    async start(id: string, ownerId: string, budget: MarketingBudget, attribution: Attribution) {
      for (const amount of [budget.dailyBudget, budget.monthlyBudget]) {
        if (!Number.isFinite(amount) || amount < 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) throw new AppError(400, "Use nonnegative budgets with at most two decimal places.");
      }
      budget = { currency: budget.currency, dailyBudget: Math.round(budget.dailyBudget * 100) / 100, monthlyBudget: Math.round(budget.monthlyBudget * 100) / 100 };
      const job = await owned(id, ownerId);
      if (job.status !== "completed" || !job.analysis) throw new AppError(409, "Complete the website analysis first.");
      if (active.has(id)) return job.marketingPlan;
      const old = job.marketingPlan;
      const trendsCollectedAt = job.marketResearch?.raw?.collectedAt || null;
      if (old?.status === "completed" && JSON.stringify(old.budget) === JSON.stringify(budget) && (old.trendsCollectedAt || null) === trendsCollectedAt) return old;
      if (stopping || active.size) throw new AppError(429, "A marketing plan is being generated. Please retry shortly.");
      const state: MarketingState = { status: "generating", budget, trendsCollectedAt, updatedAt: new Date().toISOString() };
      state.previous = old?.result ? { budget: old.budget, result: old.result, updatedAt: old.updatedAt } : old?.previous;
      let release!: () => void;
      active.set(id, new Promise<void>(resolve => { release = resolve; }));
      try {
        await save(id, state);
        await workspace.record(ownerId, "marketing_planned", `${budget.currency} daily ${budget.dailyBudget}; monthly ${budget.monthlyBudget}`, id, attribution);
        void process(job, structuredClone(state)).catch(() => undefined).finally(() => { active.delete(id); release(); });
      } catch (error) {
        state.status = "failed"; state.error = "Marketing plan could not start. Please retry.";
        try { await save(id, state); } finally { active.delete(id); release(); }
        throw error;
      }
      return state;
    },
    async close() { stopping = true; await Promise.allSettled(active.values()); },
  };
}
