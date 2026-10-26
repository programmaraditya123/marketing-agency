import type { Environment } from "./env";
import type { CrawlJob } from "../types/crawler";
import { AppError } from "../utils/app-error";
import { validateCompetitors } from "../modules/competitors/competitor.validate";
export function createCompetitorGenerator(env: Environment) {
  return async (job: CrawlJob, signal: AbortSignal) => {
    const response = await fetch(env.microserviceUrl + "/api/v1/competitors/suggestions", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Service-Token": env.serviceToken },
      body: JSON.stringify({ startUrl: job.startUrl, analysis: job.analysis }), signal,
    });
    if (!response.ok) throw new AppError(502, response.status === 429 ? "Gemini quota reached. Try competitor discovery again later." : "Gemini competitor suggestions could not be generated. Check Microservice availability and Gemini configuration.");
    return validateCompetitors(await response.json(), job.startUrl);
  };
}
