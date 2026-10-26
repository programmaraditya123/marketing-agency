import type { FastifyRequest } from "fastify";
import type { BrandBrief } from "../../types/auth";
import type { WorkspaceService } from "./workspace.helper";
import { documentIdentity } from "../auth/auth.identity";
import { AppError } from "../../utils/app-error";
type HistoryRequest = FastifyRequest<{ Querystring: { before?: string; limit?: number } }>;
export function workspaceControllers(service: WorkspaceService) {
  return {
    async history(request: HistoryRequest) {
      return { success: true, data: await service.history(request.identity.ownerId, request.query.before, request.query.limit) };
    },
    async userHistory(request: HistoryRequest) {
      if (!request.identity.userId) throw new AppError(401, "Sign in to view account history.");
      return { success: true, data: await service.history(request.identity.ownerId, request.query.before, request.query.limit) };
    },
    async guestHistory(request: HistoryRequest) {
      if (request.identity.userId) throw new AppError(409, "Use account history while signed in.");
      return { success: true, data: await service.history(request.identity.ownerId, request.query.before, request.query.limit) };
    },
    async activity(request: FastifyRequest<{ Querystring: { before?: string } }>) {
      return { success: true, data: await service.activity(request.identity.ownerId, request.query.before) };
    },
    async save(request: FastifyRequest<{ Params: { id: string }; Body: BrandBrief }>) {
      return { success: true, data: await service.saveBrief(request.identity.ownerId, request.params.id, request.body, documentIdentity(request.identity)) };
    },
    async track(request: FastifyRequest<{ Body: { analysisId: string; section: string } }>) {
      await service.track(request.identity.ownerId, request.body.analysisId, request.body.section, documentIdentity(request.identity));
      return { success: true };
    },
  };
}
