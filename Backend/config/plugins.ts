import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Environment } from "./env";
import { CORS_ORIGINS } from "./cors";
export async function registerPlugins(app: FastifyInstance, env: Environment) {
  await app.register(cors, { origin: [...CORS_ORIGINS], credentials: true, allowedHeaders: ["Content-Type", "Authorization", "X-Orbit-Request"], methods: ["GET", "HEAD", "POST", "OPTIONS"], optionsSuccessStatus: 204 });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
}
