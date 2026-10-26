import type { FastifyReply, FastifyRequest } from "fastify";
import type { CompetitorService } from "./competitor.helper";
import { documentIdentity } from "../auth/auth.identity";
type Report = FastifyRequest<{ Params: { id: string } }>;
export function competitorControllers(service: CompetitorService) {
  return {
    async get(request: Report) { return { success: true, data: await service.get(request.params.id, request.identity.ownerId) }; },
    async start(request: Report, reply: FastifyReply) {
      return reply.code(202).send({ success: true, data: await service.start(request.params.id, request.identity.ownerId, documentIdentity(request.identity)) });
    },
    async analyze(request: FastifyRequest<{ Params: { id: string; candidateId: string } }>, reply: FastifyReply) {
      return reply.code(202).send({ success: true, data: await service.analyze(request.params.id, request.params.candidateId, request.identity.ownerId, documentIdentity(request.identity)) });
    },
  };
}
