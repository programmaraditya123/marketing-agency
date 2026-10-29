import type { Environment } from "./env";
import type { Scrape } from "../types/crawler";
import { AppError } from "../utils/app-error";
export function createAnalyzer(env: Environment) {
  return async (scrape: Scrape, signal: AbortSignal): Promise<Record<string, unknown>> => {
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
  KRUTRIM_HTTP_ERROR: "AI service provider returned an error. Please try again.",
  KRUTRIM_NO_CHOICES: "AI service returned an empty response. Please try again.",
  KRUTRIM_EMPTY_RESPONSE: "AI service returned empty content. Please try again.",
  KRUTRIM_INVALID_OUTPUT: "AI service returned an invalid report. Please try again.",
  KRUTRIM_TIMEOUT: "AI service request timed out. Please try again.",
  KRUTRIM_CONNECTION_FAILED: "Cannot connect to AI service. Please try again.",
};
