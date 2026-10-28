import type { FastifyBaseLogger } from "fastify";
import type { CrawlRepository } from "../crawlers/crawler.repository";
import type { WorkspaceService } from "../workspace/workspace.helper";
import type { Environment } from "../../config/env";
import type { Attribution } from "../../types/auth";
import type {
  SeoComparisonInput,
  SeoComparisonResult,
  SeoComparisonState,
  WebsiteSeoInput,
} from "../../types/seo";
import { AppError } from "../../utils/app-error";
import { fetchText } from "../crawlers/crawler.fetch";
import { robotsAllows } from "../crawlers/crawler.scrape";
import { buildSeoInputFromScrapedPages, extractSeoFromHtml } from "./seo.extract";

export function createSeoService(
  repository: CrawlRepository,
  env: Environment,
  workspace: WorkspaceService,
  log?: FastifyBaseLogger
) {
  const active = new Map<string, Promise<void>>();
  let stopping = false;

  async function owned(id: string, ownerId: string) {
    const job = await repository.get(id);
    if (job.ownerId !== ownerId) throw new AppError(404, "Analysis not found.");
    return job;
  }

  async function save(id: string, state: SeoComparisonState) {
    state.updatedAt = new Date().toISOString();
    await repository.update(id, { seoComparison: structuredClone(state) });
  }

  function normalizeUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) throw new AppError(400, "Competitor URL is required.");
    try {
      const u = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
      return u.href;
    } catch {
      throw new AppError(400, "Please provide a valid competitor website URL.");
    }
  }

  async function fetchCompetitorSeo(targetUrl: string, childrenJobs: Awaited<ReturnType<typeof repository.children>>): Promise<WebsiteSeoInput> {
    const targetDomain = new URL(targetUrl).hostname.replace(/^www\./, "").toLowerCase();

    // Check if competitor was already audited as a child crawl job
    const matchedChild = childrenJobs.find(c => {
      try {
        return new URL(c.startUrl).hostname.replace(/^www\./, "").toLowerCase() === targetDomain;
      } catch {
        return false;
      }
    });

    if (matchedChild?.scrape?.pages && matchedChild.scrape.pages.length > 0) {
      return buildSeoInputFromScrapedPages(matchedChild.scrape.pages, targetUrl);
    }

    // Otherwise, fetch homepage HTML directly
    const signal = AbortSignal.timeout(30000);
    const origin = new URL(targetUrl).origin;
    let allowed: (p: string) => boolean = () => true;

    try {
      const robotsRes = await fetchText(`${origin}/robots.txt`, origin, signal, "text");
      allowed = robotsAllows(robotsRes.text);
    } catch {
      // Proceed even if robots.txt 404s
    }

    try {
      const pageRes = await fetchText(targetUrl, origin, signal, "html", 0, allowed);
      return extractSeoFromHtml(pageRes.text, pageRes.url);
    } catch (err) {
      log?.warn({ targetUrl, err }, "Failed fetching competitor HTML for SEO extraction, using fallback");
      return {
        url: targetUrl,
        title: targetDomain,
        description: "",
        headings: [],
        metaKeywords: "",
        structuredDataTypes: [],
        sampleText: "",
      };
    }
  }

  async function process(
    jobId: string,
    ownerId: string,
    clientSeo: WebsiteSeoInput,
    competitorSeo: WebsiteSeoInput,
    businessContext: string | null,
    competitorUrl: string,
    competitorDomain: string,
    state: SeoComparisonState
  ) {
    try {
      const payload: SeoComparisonInput = {
        client: clientSeo,
        competitor: competitorSeo,
        businessContext,
      };

      const response = await fetch(`${env.microserviceUrl}/api/v1/seo/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        log?.error({ status: response.status, errorText }, "Microservice SEO comparison failed");
        throw new Error("Provider failed");
      }

      const result = (await response.json()) as SeoComparisonResult;
      state.status = "completed";
      state.activeCompetitorUrl = competitorUrl;
      state.activeCompetitorDomain = competitorDomain;
      state.result = result;
      state.savedComparisons = state.savedComparisons || {};
      state.savedComparisons[competitorDomain] = result;
      await save(jobId, state);
    } catch (err) {
      log?.error({ jobId, err }, "SEO comparison process failed");
      state.status = "failed";
      state.error = "Head-to-head SEO comparison could not finish. Please retry or check that the competitor URL is accessible.";
      await save(jobId, state);
    }
  }

  return {
    async get(id: string, ownerId: string) {
      const job = await owned(id, ownerId);
      const children = await repository.children(id);
      const discoveredCompetitors = job.competitors?.results?.map(c => ({
        id: c.id,
        title: c.title,
        domain: c.domain,
        url: c.url,
        isAudited: children.some(child => child.competitorId === c.id && child.status === "completed"),
      })) || [];

      return {
        ...(job.seoComparison || {
          status: "idle",
          updatedAt: new Date().toISOString(),
          savedComparisons: {},
        }),
        discoveredCompetitors,
      };
    },

    async start(id: string, rawCompetitorUrl: string, ownerId: string, attribution: Attribution) {
      const job = await owned(id, ownerId);
      if (job.status !== "completed" || !job.analysis) {
        throw new AppError(409, "Complete the website analysis first before running SEO comparison.");
      }

      const competitorUrl = normalizeUrl(rawCompetitorUrl);
      const competitorDomain = new URL(competitorUrl).hostname.replace(/^www\./, "").toLowerCase();
      const clientDomain = new URL(job.startUrl).hostname.replace(/^www\./, "").toLowerCase();

      if (competitorDomain === clientDomain) {
        throw new AppError(400, "Please select an external competitor website to compare against.");
      }

      if (stopping || active.size >= 5) {
        throw new AppError(429, "An SEO comparison is currently running. Please retry in a few moments.");
      }

      const current = job.seoComparison;
      // If already cached in savedComparisons, switch to it immediately
      if (current?.savedComparisons?.[competitorDomain]) {
        current.status = "completed";
        current.activeCompetitorUrl = competitorUrl;
        current.activeCompetitorDomain = competitorDomain;
        current.result = current.savedComparisons[competitorDomain];
        await save(id, current);
        return current;
      }

      if (active.has(id)) {
        return job.seoComparison;
      }

      const state: SeoComparisonState = {
        status: "generating",
        activeCompetitorUrl: competitorUrl,
        activeCompetitorDomain: competitorDomain,
        savedComparisons: current?.savedComparisons || {},
        updatedAt: new Date().toISOString(),
      };

      let release!: () => void;
      active.set(id, new Promise<void>(resolve => { release = resolve; }));

      try {
        await save(id, state);
        await workspace.record(
          ownerId,
          "seo_comparison_generated",
          `SEO & Keyword comparison vs ${competitorDomain}`,
          id,
          attribution
        );

        const children = await repository.children(id);
        const competitorSeo = await fetchCompetitorSeo(competitorUrl, children);
        const clientSeo = buildSeoInputFromScrapedPages(job.scrape?.pages || [], job.startUrl);

        const industry = (job.analysis as Record<string, unknown>)?.company && typeof (job.analysis as Record<string, unknown>).company === "object"
          ? String(((job.analysis as Record<string, unknown>).company as Record<string, unknown>)?.industry || "")
          : "";
        const businessContext = industry ? `Industry/Category: ${industry}` : null;

        void process(
          id,
          ownerId,
          clientSeo,
          competitorSeo,
          businessContext,
          competitorUrl,
          competitorDomain,
          structuredClone(state)
        )
          .catch(() => undefined)
          .finally(() => {
            active.delete(id);
            release();
          });
      } catch (error) {
        state.status = "failed";
        state.error = "SEO comparison could not start. Please retry.";
        try {
          await save(id, state);
        } finally {
          active.delete(id);
          release();
        }
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

export type SeoService = ReturnType<typeof createSeoService>;
