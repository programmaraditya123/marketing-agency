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
import { createCompetitorService } from "../modules/competitors/competitor.helper";
import { createCompetitorGenerator } from "./competitors";
import competitorRoutes from "../modules/competitors/competitor.routes";
import { createMarketService } from "../modules/market/market.service";
import marketRoutes from "../modules/market/market.routes";
import { createMarketingService } from "../modules/marketing/marketing.service";
import marketingRoutes from "../modules/marketing/marketing.routes";
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
    const competitors = createCompetitorService(createRepository(database.jobs), service, workspace, createCompetitorGenerator(env), app.log);
    const market = createMarketService(createRepository(database.jobs), env, workspace);
    const marketing = createMarketingService(createRepository(database.jobs), env, workspace);
    app.addHook("onClose", async () => {
      await Promise.allSettled([marketing.close(), market.close(), competitors.close()]);
      await service.close(); await database.client.close();
    });
    await registerRoutes(app, service, async () => { await database.client.db().command({ ping: 1 }); }, { auth, workspace, env });
    await app.register(competitorRoutes, { prefix: "/api/v1", service: competitors });
    await app.register(marketRoutes, { prefix: "/api/v1", service: market });
    await app.register(marketingRoutes, { prefix: "/api/v1", service: marketing });
    return app;
  } catch (error) { await app.close(); throw error; }
}
