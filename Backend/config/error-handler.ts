import type { FastifyInstance } from "fastify";
import { AppError } from "../utils/app-error";
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const code = error instanceof Error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    if (code >= 500) request.log.error({ err: error }, "Request failed");
    return reply.code(code).send({ success: false, message:
      error instanceof AppError ? error.message : code < 500 ? "Invalid request" : "Service unavailable. Please try again." });
  });
}
