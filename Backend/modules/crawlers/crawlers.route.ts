import type { FastifyInstance } from "fastify";
import type { CrawlService } from "./crawler.helper";
import { crawlControllers } from "./crawler.controller";
import { createResponse, jobResponse } from "./crawler.schema";
import type { WorkspaceService } from "../workspace/workspace.helper";
export default async function crawlerRoutes(app: FastifyInstance, options: { service: CrawlService; workspace?: WorkspaceService }) {
  const controller = crawlControllers(options.service, options.workspace);
  const schema = { response: { 202: createResponse }, body: { type: "object", additionalProperties: false, required: ["startUrl"],
    properties: { startUrl: { type: "string", minLength: 3, maxLength: 2048 } } } };
  app.post("/analyses", { schema, config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, controller.create);
  // Existing URL retained; returns an asynchronous job instead of an in-memory scrape.
  app.post("/crawlwebsite", { schema, config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, controller.create);
  app.get("/analyses/:id", { schema: { response: { 200: jobResponse }, params: { type: "object", required: ["id"],
    properties: { id: { type: "string", pattern: "^[a-f0-9]{64}$" } } } } }, controller.get);
}
