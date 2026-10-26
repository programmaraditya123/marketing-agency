import Fastify from "fastify";
import type { Environment } from "./env";
import { connectDatabase } from "./database";
import { registerPlugins } from "./plugins";
import { registerErrorHandler } from "./error-handler";
import { registerRoutes } from "./routes";
import { createAnalyzer } from "./microservice";
import { createRepository } from "../modules/crawlers/crawler.repository";
import { createCrawlService } from "../modules/crawlers/crawler.helper";
import { createAuthService } from "../modules/auth/auth.helper";
import { registerIdentity } from "../modules/auth/auth.middleware";
import { createWorkspaceService } from "../modules/workspace/workspace.helper";
export async function buildApplication(env: Environment) {
  const app = Fastify({ bodyLimit: 8192, logger: { redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']", "req.body.password"] } });
  try {
    await registerPlugins(app, env);
    registerErrorHandler(app);
    const database = await connectDatabase(env);
    const auth = createAuthService(database);
    registerIdentity(app, auth, env);
    const workspace = createWorkspaceService(database.jobs, database.activities);
    const service = createCrawlService(createRepository(database.jobs), createAnalyzer(env), app.log);
    app.addHook("onClose", async () => { await service.close(); await database.client.close(); });
    await registerRoutes(app, service, async () => { await database.client.db().command({ ping: 1 }); }, { auth, workspace, env });
    return app;
  } catch (error) { await app.close(); throw error; }
}
