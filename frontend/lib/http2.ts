import { env } from "@/config/env";
import { createHttpClient } from "./http";
// Reserved for browser-safe FastAPI endpoints. Analysis uses Fastify; its service token stays private.
export const http2 = createHttpClient(env.fastapiUrl);
