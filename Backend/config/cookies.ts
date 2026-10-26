import type { FastifyReply } from "fastify";
import type { Environment } from "./env";
export function sessionCookie(header?: string) {
  return header?.split(";").map(s => s.trim()).find(s => s.startsWith("orbit_session="))?.slice(14);
}
export function visitorCookie(header?: string) {
  return header?.split(";").map(s => s.trim()).find(s => s.startsWith("orbit_visitor="))?.slice(14);
}
function appendCookie(reply: FastifyReply, value: string) {
  const previous = reply.getHeader("Set-Cookie");
  const name = value.slice(0, value.indexOf("="));
  const cookies = (Array.isArray(previous) ? previous.map(String) : previous ? [String(previous)] : []).filter(cookie => !cookie.startsWith(`${name}=`));
  reply.header("Set-Cookie", [...cookies, value]);
}
export function setSessionCookie(reply: FastifyReply, token: string, env: Environment) {
  appendCookie(reply, `orbit_session=${token}; Path=/api/v1; HttpOnly; SameSite=${env.cookieSameSite}; Max-Age=604800${env.cookieSecure ? "; Secure" : ""}`);
}
export function setVisitorCookie(reply: FastifyReply, token: string, env: Environment) {
  appendCookie(reply, `orbit_visitor=${token}; Path=/api/v1; HttpOnly; SameSite=${env.cookieSameSite}; Max-Age=31536000${env.cookieSecure ? "; Secure" : ""}`);
}
