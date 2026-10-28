import type { FastifyInstance, FastifyRequest } from "fastify";
import type { createSeoService } from "./seo.service";
import { documentIdentity } from "../auth/auth.identity";

export default async function seoRoutes(
  app: FastifyInstance,
  options: { service: ReturnType<typeof createSeoService> }
) {
  const params = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string", pattern: "^[a-f0-9]{64}$" } },
  };

  app.get(
    "/analyses/:id/seo-comparison",
    { schema: { params } },
    async (req: FastifyRequest<{ Params: { id: string } }>) => ({
      success: true,
      data: await options.service.get(req.params.id, req.identity.ownerId),
    })
  );

  app.post(
    "/analyses/:id/seo-comparison",
    {
      schema: {
        params,
        body: {
          type: "object",
          required: ["competitorUrl"],
          additionalProperties: false,
          properties: {
            competitorUrl: { type: "string", minLength: 3, maxLength: 2048 },
          },
        },
      },
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { competitorUrl: string } }>,
      reply
    ) =>
      reply.code(202).send({
        success: true,
        data: await options.service.start(
          req.params.id,
          req.body.competitorUrl,
          req.identity.ownerId,
          documentIdentity(req.identity)
        ),
      })
  );
}
