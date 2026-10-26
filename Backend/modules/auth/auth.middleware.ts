import type { FastifyInstance } from "fastify";
import type { Environment } from "../../config/env";
import { createJwt } from "../../config/jwt";
import { sessionCookie, setSessionCookie } from "../../config/cookies";
import { AppError } from "../../utils/app-error";
import type { AuthService } from "./auth.helper";
export function registerIdentity(app: FastifyInstance, auth: AuthService, env: Environment) {
  const jwt = createJwt(env.jwtSecret);
  app.decorateRequest("identity");
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/v1/") || request.method === "OPTIONS") return;
    reply.header("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(request.method)) {
      if (request.headers["x-orbit-request"] !== "1" ||
        (request.headers.origin && !env.corsOrigins.includes(request.headers.origin))) throw new AppError(403, "Request origin could not be verified.");
    }
    const bearer = request.headers.authorization;
    if (bearer && !/^Bearer \S+$/.test(bearer)) throw new AppError(401, "Invalid access token.");
    const token = bearer?.slice(7) || sessionCookie(request.headers.cookie);
    if (token) {
      try { request.identity = await auth.resolve(jwt.verify(token)); return; }
      catch (error) {
        // Only the bootstrap endpoint replaces an expired browser cookie.
        if (bearer || request.routeOptions.url !== "/api/v1/auth/me") throw error;
      }
    }
    request.identity = await auth.newSession();
    setSessionCookie(reply, jwt.issue(request.identity.sessionId), env);
  });
}
