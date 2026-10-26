import type { FastifyInstance } from "fastify";
import type { Environment } from "../../config/env";
import { createJwt } from "../../config/jwt";
import { sessionCookie, setSessionCookie, visitorCookie, setVisitorCookie } from "../../config/cookies";
import { createVisitorToken, VISITOR_LIFETIME } from "../../config/visitor";
import { AppError } from "../../utils/app-error";
import type { AuthService } from "./auth.helper";
import { CORS_ORIGINS } from "../../config/cors";
export function registerIdentity(app: FastifyInstance, auth: AuthService, env: Environment) {
  const jwt = createJwt(env.jwtSecret);
  const visitorJwt = createVisitorToken(env.jwtSecret);
  app.decorateRequest("identity");
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/v1/") || request.method === "OPTIONS") return;
    reply.header("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(request.method)) {
      if (request.headers["x-orbit-request"] !== "1" ||
        (request.headers.origin && !CORS_ORIGINS.some(origin => origin === request.headers.origin))) throw new AppError(403, "Request origin could not be verified.");
    }
    const bearer = request.headers.authorization;
    if (bearer && !/^Bearer \S+$/.test(bearer)) throw new AppError(401, "Invalid access token.");
    const token = bearer?.slice(7) || sessionCookie(request.headers.cookie);
    const bootstrap = request.routeOptions.url === "/api/v1/auth/me";
    async function findVisitor() {
      let proven: string | undefined;
      try { const cookie = visitorCookie(request.headers.cookie); if (cookie) proven = visitorJwt.verify(cookie); } catch { /* Invalid proof never grants access. */ }
      const proposed = request.headers["x-orbit-visitor-id"];
      return auth.visitor(proven, typeof proposed === "string" ? proposed : undefined);
    }
    if (token) {
      try {
        request.identity = await auth.resolve(jwt.verify(token));
        const needsVisitor = !request.identity.visitorId;
        if (needsVisitor) request.identity = await auth.bindVisitor(request.identity, await findVisitor());
        if (bootstrap || needsVisitor) setVisitorCookie(reply, visitorJwt.issue(request.identity.visitorId!, VISITOR_LIFETIME), env);
        return;
      }
      catch (error) {
        if (!(error instanceof AppError) || error.statusCode !== 401) throw error;
        // Only the bootstrap endpoint replaces an expired browser cookie.
        if (bearer || request.routeOptions.url !== "/api/v1/auth/me") throw error;
      }
    }
    request.identity = await auth.newSession(undefined, await findVisitor());
    setSessionCookie(reply, jwt.issue(request.identity.sessionId), env);
    setVisitorCookie(reply, visitorJwt.issue(request.identity.visitorId!, VISITOR_LIFETIME), env);
  });
}
