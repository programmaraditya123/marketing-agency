import type { FastifyInstance, FastifyRequest } from "fastify";
import type { createContentService } from "./content.service";
import { documentIdentity } from "../auth/auth.identity";

export default async function contentRoutes(app: FastifyInstance, options: { service: ReturnType<typeof createContentService> }) {
  const params = { type: "object", required: ["id"], properties: { id: { type: "string", pattern: "^[a-f0-9]{64}$" } } };

  app.get(
    "/analyses/:id/content-strategy",
    { schema: { params } },
    async (req: FastifyRequest<{ Params: { id: string } }>) => ({
      success: true,
      data: await options.service.get(req.params.id, req.identity.ownerId),
    })
  );

  app.post(
    "/analyses/:id/content-strategy",
    {
      schema: {
        params,
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            focusGoal: { type: "string", maxLength: 100 },
          },
        },
      },
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { focusGoal?: string } }>, reply) =>
      reply.code(202).send({
        success: true,
        data: await options.service.start(
          req.params.id,
          req.identity.ownerId,
          documentIdentity(req.identity),
          req.body?.focusGoal
        ),
      })
  );
}
