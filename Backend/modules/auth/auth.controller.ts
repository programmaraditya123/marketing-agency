import type { FastifyRequest, FastifyReply } from "fastify";
import type { AuthService } from "./auth.helper";
import type { Environment } from "../../config/env";
import { createJwt } from "../../config/jwt";
import { setSessionCookie } from "../../config/cookies";
export function authControllers(auth: AuthService, env: Environment) {
  const jwt = createJwt(env.jwtSecret);
  const authenticate = (mode: "register" | "login") => async (request: FastifyRequest<{ Body: { email: string; password: string; name?: string } }>, reply: FastifyReply) => {
    const result = await auth.authenticate(mode, request.body, request.identity);
    setSessionCookie(reply, jwt.issue(result.identity.sessionId), env);
    return reply.code(mode === "register" ? 201 : 200).send({ success: true, data: { user: result.user,
      visitorId: result.identity.visitorId, accessToken: jwt.issue(result.identity.sessionId, 900), expiresIn: 900 } });
  };
  return {
    register: authenticate("register"), login: authenticate("login"),
    async me(request: FastifyRequest) { return { success: true, data: { user: await auth.me(request.identity), visitorId: request.identity.visitorId } }; },
    async logout(request: FastifyRequest, reply: FastifyReply) {
      const next = await auth.logout(request.identity);
      setSessionCookie(reply, jwt.issue(next.sessionId), env);
      return { success: true, data: { user: null, visitorId: next.visitorId } };
    },
  };
}
