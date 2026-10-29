import type { FastifyReply, FastifyRequest } from "fastify";
import type { CrawlService } from "./crawler.helper";
import type { WorkspaceService } from "../workspace/workspace.helper";
import { documentIdentity } from "../auth/auth.identity";
export function crawlControllers(service: CrawlService, workspace?: WorkspaceService) {
  return {
    async create(request: FastifyRequest<{ Body: { startUrl: string } }>, reply: FastifyReply) {
      const data = await service.create(request.body.startUrl, request.identity?.ownerId, undefined, documentIdentity(request.identity));
      if (workspace) await workspace.record(request.identity.ownerId, "website_searched", request.body.startUrl, data.id, documentIdentity(request.identity));
      return reply.code(202).send({ success: true, data });
    },
    async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      reply.header("Cache-Control", "no-store");
      return { success: true, data: await service.get(request.params.id, request.identity?.ownerId) };
    },
    async retry(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      const data = await service.retry(request.params.id, request.identity?.ownerId);
      return reply.code(202).send({ success: true, data });
    },
  };
}
