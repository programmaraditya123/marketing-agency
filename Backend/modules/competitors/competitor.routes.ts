import type { FastifyInstance } from "fastify";
import type { CompetitorService } from "./competitor.helper";
import { competitorControllers } from "./competitor.controller";
export default async function competitorRoutes(app: FastifyInstance, options: { service: CompetitorService }) {
  const controllers = competitorControllers(options.service);
  const id = { type: "string", pattern: "^[a-f0-9]{64}$" };
  const params = { type: "object", required: ["id"], properties: { id } };
  const body = { type: "object", additionalProperties: false, properties: {} };
  app.get("/analyses/:id/competitors", { schema: { params } }, controllers.get);
  app.post("/analyses/:id/competitors", { schema: { params, body }, config: { rateLimit: { max: 3, timeWindow: "1 minute" } } }, controllers.start);
  app.post("/analyses/:id/competitors/:candidateId/analysis", { schema: { body, params: {
    type: "object", required: ["id", "candidateId"], properties: { id, candidateId: { type: "string", pattern: "^[a-f0-9]{24}$" } },
  } }, config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, controllers.analyze);
}
