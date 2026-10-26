import type { FastifyInstance } from "fastify";
import type { WorkspaceService } from "./workspace.helper";
import { workspaceControllers } from "./workspace.controller";
const id = { type: "string", pattern: "^[a-f0-9]{64}$" };
export default async function workspaceRoutes(app: FastifyInstance, options: { workspace: WorkspaceService }) {
  const controller = workspaceControllers(options.workspace);
  const querystring = { type: "object", additionalProperties: false, properties: { before: { type: "string", minLength: 1, maxLength: 256, pattern: "^[A-Za-z0-9_-]+$" } } };
  const historyQuery = { ...querystring, properties: { ...querystring.properties, limit: { type: "integer", minimum: 1, maximum: 50 } } };
  app.get("/history", { schema: { querystring: historyQuery } }, controller.history);
  app.get("/history/user", { schema: { querystring: historyQuery } }, controller.userHistory);
  app.get("/history/guest", { schema: { querystring: historyQuery } }, controller.guestHistory);
  app.get("/activity", { schema: { querystring } }, controller.activity);
  const text = { type: "string", maxLength: 4000 };
  app.post("/analyses/:id/brief", { schema: {
    params: { type: "object", required: ["id"], properties: { id } },
    body: { type: "object", additionalProperties: false, required: ["product", "audience", "pastSteps", "futurePlans", "goals"],
      properties: { product: text, audience: text, pastSteps: text, futurePlans: text, goals: text } },
  }, bodyLimit: 32768 }, controller.save);
  app.post("/activity", { schema: { body: { type: "object", additionalProperties: false, required: ["analysisId", "section"], properties: {
    analysisId: id, section: { type: "string", enum: ["Brand Overview", "Your Product", "Target Audience", "Brand Voice", "Past Steps", "Future Plans", "Growth Ideas", "Content Themes", "Competitor Search", "Website Analytics", "Market Demand", "Marketing Plan", "Research Sources", "Search History", "Your Activity"] },
  } } }, config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, controller.track);
}
