import type { Environment } from "./env";
import type { Scrape } from "../types/crawler";
import { AppError } from "../utils/app-error";

export function createAnalyzer(env: Environment) {
  return async (scrape: Scrape, signal: AbortSignal): Promise<Record<string, unknown>> => {
    // 1. Try async job endpoint to avoid AppSail 30-second gateway timeout
    try {
      const asyncRes = await fetch(`${env.microserviceUrl}/api/v1/analyses/async`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
        body: JSON.stringify(scrape),
        signal,
      });

      if (asyncRes.status === 202) {
        const { jobId } = await asyncRes.json() as { jobId: string };
        const pollDeadline = Date.now() + 150000;
        while (Date.now() < pollDeadline && !signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          if (signal.aborted) break;

          const jobRes = await fetch(`${env.microserviceUrl}/api/v1/analyses/jobs/${jobId}`, {
            headers: { "X-Service-Token": env.serviceToken },
            signal,
          });

          if (!jobRes.ok) continue;
          const job = await jobRes.json() as { status: string; result?: Record<string, unknown>; error?: string; code?: string };
          if (job.status === "completed" && job.result) {
            return job.result;
          }
          if (job.status === "failed") {
            const message = job.code ? ANALYSIS_ERRORS[job.code] : undefined;
            throw new AppError(502, message || job.error || "AI analysis failed. Please try again.");
          }
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fall through to synchronous call below on network/fallback scenarios
    }

    // 2. Synchronous fallback for direct or legacy endpoints
    const response = await fetch(`${env.microserviceUrl}/api/v1/analyses`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
      body: JSON.stringify(scrape), signal,
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const code = body && typeof body === "object" && "code" in body ? body.code : undefined;
      const message = typeof code === "string" ? ANALYSIS_ERRORS[code] : undefined;
      throw new AppError(502, message || (response.status === 401 ? "Microservice authentication failed. Check that MICROSERVICE_TOKEN matches in both services."
        : response.status === 402 ? "AI service quota or payment limit reached. Please check the API configuration."
        : response.status === 408 ? "AI analysis exceeded gateway execution timeout. Please retry."
        : response.status === 429 ? "Gemini quota or rate limit reached. Try again later."
        : "AI analysis failed. The scraped data has been saved; please check the microservice configuration."));
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("company" in result) || !("targetAudience" in result)) {
      throw new AppError(502, "AI service returned an invalid analysis.");
    }
    return result as Record<string, unknown>;
  };
}

const ANALYSIS_ERRORS: Record<string, string> = {
  GEMINI_AUTH_FAILED: "Gemini credentials were rejected. Check the API key and its permissions.",
  GEMINI_MODEL_UNAVAILABLE: "The configured Gemini model is unavailable. Check GEMINI_MODEL.",
  GEMINI_RATE_LIMITED: "Gemini quota or rate limit reached. Try again later.",
  GEMINI_REQUEST_REJECTED: "Gemini rejected the analysis request or output schema.",
  GEMINI_UNAVAILABLE: "Gemini is temporarily unavailable. Please try again later.",
  GEMINI_TIMEOUT: "Gemini analysis timed out. Please try again or select a faster model.",
  GEMINI_CONNECTION_FAILED: "Cannot connect to Gemini. Check the microservice network connection.",
  GEMINI_OUTPUT_LIMIT: "Gemini reached its output limit before completing the report.",
  GEMINI_BLOCKED: "Gemini could not complete a safe analysis of this website.",
  GEMINI_INVALID_OUTPUT: "Gemini returned an invalid structured report. Please try again.",
  ANALYSIS_FAILED: "AI analysis could not complete structured report verification. Please try again.",
  EXECUTION_TIME_EXCEEDED: "AI analysis exceeded gateway execution timeout. Please retry.",
  KRUTRIM_HTTP_ERROR: "AI service provider returned an error. Please try again.",
  KRUTRIM_NO_CHOICES: "AI service returned an empty response. Please try again.",
  KRUTRIM_EMPTY_RESPONSE: "AI service returned empty content. Please try again.",
  KRUTRIM_INVALID_OUTPUT: "AI service returned an invalid report. Please try again.",
  KRUTRIM_TIMEOUT: "AI service request timed out. Please try again.",
  KRUTRIM_CONNECTION_FAILED: "Cannot connect to AI service. Please try again.",
};
