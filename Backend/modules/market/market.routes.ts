import type { FastifyInstance, FastifyRequest } from "fastify";
import type { createMarketService } from "./market.service";
import type { TrendInput } from "../../types/market";
import { documentIdentity } from "../auth/auth.identity";
export default async function marketRoutes(app: FastifyInstance, options: { service: ReturnType<typeof createMarketService> }) {
  const params = { type: "object", required: ["id"], properties: { id: { type: "string", pattern: "^[a-f0-9]{64}$" } } };
  app.get("/analyses/:id/market-research", { schema: { params } }, async (request: FastifyRequest<{ Params: { id: string } }>) => ({ success: true, data: await options.service.get(request.params.id, request.identity.ownerId) }));
  app.post("/analyses/:id/market-research", { schema: { params, body: { type: "object", additionalProperties: false, required: ["terms", "geo", "timeframe"], properties: {
    terms: { type: "array", minItems: 1, maxItems: 5, uniqueItems: true, items: { type: "string", minLength: 1, maxLength: 80, pattern: "\\S" } },
    geo: { type: "string", pattern: "^([A-Z]{2})?$" }, timeframe: { type: "string", enum: ["today 12-m", "today 3-m", "today 5-y"] },
  } } }, config: { rateLimit: { max: 3, timeWindow: "1 minute" } } }, async (request: FastifyRequest<{ Params: { id: string }; Body: TrendInput }>, reply) => reply.code(202).send({ success: true, data: await options.service.start(request.params.id, request.identity.ownerId, request.body, documentIdentity(request.identity)) }));
}
