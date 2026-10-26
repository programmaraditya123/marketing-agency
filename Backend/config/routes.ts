import type { FastifyInstance } from "fastify";
import crawlerRoutes from "../modules/crawlers/crawlers.route";
import healthRoutes from "../modules/health/health.routes";
import type { CrawlService } from "../modules/crawlers/crawler.helper";
import authRoutes from "../modules/auth/auth.routes";
import workspaceRoutes from "../modules/workspace/workspace.routes";
import type { AuthService } from "../modules/auth/auth.helper";
import type { WorkspaceService } from "../modules/workspace/workspace.helper";
import type { Environment } from "./env";
export async function registerRoutes(app: FastifyInstance, service: CrawlService, ready: () => Promise<void>, options: { auth: AuthService; workspace: WorkspaceService; env: Environment }) {
  await app.register(healthRoutes, { ready });
  await app.register(authRoutes, { prefix: "/api/v1/auth", ...options });
  await app.register(workspaceRoutes, { prefix: "/api/v1", workspace: options.workspace });
  await app.register(crawlerRoutes, { prefix: "/api/v1", service, workspace: options.workspace });
}
