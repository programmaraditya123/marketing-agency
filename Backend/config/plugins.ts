import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Environment } from "./env";
export async function registerPlugins(app: FastifyInstance, env: Environment) {
  if (!env.corsManagedByCatalyst) await app.register(cors, { origin: env.corsOrigins, credentials: true, allowedHeaders: ["Content-Type", "Authorization", "X-Orbit-Request"], methods: ["GET", "POST", "OPTIONS"] });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
}
