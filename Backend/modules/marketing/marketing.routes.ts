import type { FastifyInstance, FastifyRequest } from "fastify";
import type { createMarketingService } from "./marketing.service";
import type { MarketingBudget } from "../../types/marketing";
import { documentIdentity } from "../auth/auth.identity";
export default async function marketingRoutes(app: FastifyInstance, options: { service: ReturnType<typeof createMarketingService> }) {
  const params = { type: "object", required: ["id"], properties: { id: { type: "string", pattern: "^[a-f0-9]{64}$" } } };
  app.get("/analyses/:id/marketing-plan", { schema: { params } }, async (req: FastifyRequest<{ Params: { id: string } }>) => ({ success: true, data: await options.service.get(req.params.id, req.identity.ownerId) }));
  app.post("/analyses/:id/marketing-plan", { schema: { params, body: { type: "object", additionalProperties: false, required: ["currency", "dailyBudget", "monthlyBudget"], properties: {
    currency: { type: "string", enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"] },
    dailyBudget: { type: "number", minimum: 0, maximum: 100000000 },
    monthlyBudget: { type: "number", minimum: 0, maximum: 1000000000 },
  } } }, config: { rateLimit: { max: 3, timeWindow: "1 minute" } } }, async (req: FastifyRequest<{ Params: { id: string }; Body: MarketingBudget }>, reply) => reply.code(202).send({ success: true, data: await options.service.start(req.params.id, req.identity.ownerId, req.body, documentIdentity(req.identity)) }));
}
