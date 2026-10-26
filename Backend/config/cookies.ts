import type { FastifyReply } from "fastify";
import type { Environment } from "./env";
export function sessionCookie(header?: string) {
  return header?.split(";").map(s => s.trim()).find(s => s.startsWith("orbit_session="))?.slice(14);
}
export function setSessionCookie(reply: FastifyReply, token: string, env: Environment) {
  reply.header("Set-Cookie", `orbit_session=${token}; Path=/api/v1; HttpOnly; SameSite=${env.cookieSameSite}; Max-Age=604800${env.cookieSecure ? "; Secure" : ""}`);
}
