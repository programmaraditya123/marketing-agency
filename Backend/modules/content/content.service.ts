import type { CrawlRepository } from "../crawlers/crawler.repository";
import type { WorkspaceService } from "../workspace/workspace.helper";
import type { Environment } from "../../config/env";
import type { Attribution } from "../../types/auth";
import type { ContentStrategy, ContentStrategyState } from "../../types/content";
import { AppError } from "../../utils/app-error";

export function createContentService(repository: CrawlRepository, env: Environment, workspace: WorkspaceService) {
  const active = new Map<string, Promise<void>>();
  let stopping = false;

  async function owned(id: string, ownerId: string) {
    const job = await repository.get(id);
    if (job.ownerId !== ownerId) throw new AppError(404, "Analysis not found.");
    return job;
  }

  async function save(id: string, state: ContentStrategyState) {
    state.updatedAt = new Date().toISOString();
    await repository.update(id, { contentStrategy: structuredClone(state) });
  }

  async function process(job: Awaited<ReturnType<typeof owned>>, state: ContentStrategyState) {
    try {
      const response = await fetch(`${env.microserviceUrl}/api/v1/content/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
        body: JSON.stringify({
          website: job.startUrl,
          business: job.analysis,
          focusGoal: state.focusGoal || null,
          socialLinks: job.scrape?.socialLinks || [],
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error("Provider failed");
      state.result = (await response.json()) as ContentStrategy;
      state.status = "completed";
      await save(job._id, state);
    } catch {
      state.status = "failed";
      state.error = "Content and posting strategy could not be generated. Please retry.";
      await save(job._id, state);
    }
  }

  return {
    async get(id: string, ownerId: string) {
      return (await owned(id, ownerId)).contentStrategy || null;
    },

    async start(id: string, ownerId: string, attribution: Attribution, focusGoal?: string) {
      const job = await owned(id, ownerId);
      if (job.status !== "completed" || !job.analysis) throw new AppError(409, "Complete the website analysis first.");
      if (active.has(id)) return job.contentStrategy;

      const old = job.contentStrategy;
      if (old?.status === "completed" && old.focusGoal === focusGoal) return old;
      if (stopping || active.size >= 5) throw new AppError(429, "A strategy is being generated. Please retry shortly.");

      const state: ContentStrategyState = {
        status: "generating",
        focusGoal: focusGoal || undefined,
        updatedAt: new Date().toISOString(),
      };

      let release!: () => void;
      active.set(id, new Promise<void>(resolve => { release = resolve; }));
      try {
        await save(id, state);
        await workspace.record(
          ownerId,
          "content_strategy_generated",
          focusGoal ? `Social media & posting strategy (${focusGoal})` : "Social media & posting strategy",
          id,
          attribution
        );
        void process(job, structuredClone(state)).catch(() => undefined).finally(() => {
          active.delete(id);
          release();
        });
      } catch (error) {
        state.status = "failed";
        state.error = "Content strategy could not start. Please retry.";
        try { await save(id, state); } finally { active.delete(id); release(); }
        throw error;
      }
      return state;
    },

    async close() {
      stopping = true;
      await Promise.allSettled(active.values());
    },
  };
}

export type ContentService = ReturnType<typeof createContentService>;
