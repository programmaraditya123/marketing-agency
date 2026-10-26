import type { FastifyRequest } from "fastify";
import type { BrandBrief } from "../../types/auth";
import type { WorkspaceService } from "./workspace.helper";
export function workspaceControllers(service: WorkspaceService) {
  return {
    async history(request: FastifyRequest<{ Querystring: { before?: string } }>) {
      return { success: true, data: await service.history(request.identity.ownerId, request.query.before) };
    },
    async activity(request: FastifyRequest<{ Querystring: { before?: string } }>) {
      return { success: true, data: await service.activity(request.identity.ownerId, request.query.before) };
    },
    async save(request: FastifyRequest<{ Params: { id: string }; Body: BrandBrief }>) {
      return { success: true, data: await service.saveBrief(request.identity.ownerId, request.params.id, request.body) };
    },
    async track(request: FastifyRequest<{ Body: { analysisId: string; section: string } }>) {
      await service.track(request.identity.ownerId, request.body.analysisId, request.body.section);
      return { success: true };
    },
  };
}
