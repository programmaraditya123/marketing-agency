const text = { type: "string" };
const status = { type: "string", enum: ["queued", "crawling", "analyzing", "completed", "failed"] };
const social = { type: "object", additionalProperties: false, required: ["platform", "url", "discoveredOn"],
  properties: { platform: text, url: text, discoveredOn: text } };
function envelope(properties: Record<string, unknown>, required: string[]) {
  return { type: "object", additionalProperties: false, required: ["success", "data"], properties: {
    success: { type: "boolean", const: true },
    data: { type: "object", additionalProperties: false, required, properties },
  } };
}
export const createResponse = envelope({ id: text, status }, ["id", "status"]);
export const jobResponse = envelope({
  id: text, startUrl: text, status, createdAt: text, updatedAt: text, error: text,
  parentAnalysisId: text, competitorId: text,
  brief: { type: "object", additionalProperties: false, properties: { product: text, audience: text, pastSteps: text, futurePlans: text, goals: text } },
  totalPagesScraped: { type: "integer", minimum: 0 },
  // The microservice owns the nested Pydantic analysis contract and validates it before return.
  analysis: { type: "object", additionalProperties: true },
  socialLinks: { type: "array", items: social },
  sources: { type: "array", items: { type: "object", additionalProperties: false,
    required: ["url", "title"], properties: { url: text, title: text } } },
  warnings: { type: "array", items: text },
}, ["id", "startUrl", "status", "createdAt", "updatedAt", "totalPagesScraped", "socialLinks", "sources", "warnings"]);
