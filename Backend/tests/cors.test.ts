import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { registerPlugins } from "../config/plugins";
const origin = "https://orbit.vidorahub.com";
test("Orbit domain receives credentialed API preflight and error response CORS headers", async t => {
  const app = Fastify(); t.after(() => app.close());
  await registerPlugins(app, { port: 9000, host: "127.0.0.1", mongoUri: "", mongoDatabase: "test", microserviceUrl: "http://127.0.0.1:8000", serviceToken: "test-service".repeat(4), jwtSecret: "test-jwt".repeat(8), cookieSecure: true, cookieSameSite: "None", corsManagedByCatalyst: false, corsOrigins: ["http://localhost:3000", origin] });
  app.get("/api/v1/history", async (_request, reply) => reply.code(401).send({ success: false }));
  app.post("/api/v1/analyses", async () => ({ success: true }));
  for (const url of ["/api/v1/auth/me", "/api/v1/auth/login", "/api/v1/analyses"]) {
    const response = await app.inject({ method: "OPTIONS", url, headers: { origin, "access-control-request-method": "POST", "access-control-request-headers": "content-type,x-orbit-request,authorization" } });
    assert.equal(response.statusCode, 204);
    assert.equal(response.headers["access-control-allow-origin"], origin);
    assert.equal(response.headers["access-control-allow-credentials"], "true");
    assert.match(String(response.headers.vary), /Origin/);
  }
  const denied = await app.inject({ method: "OPTIONS", url: "/api/v1/analyses", headers: { origin: "https://orbit.vidorahub.com.attacker.test", "access-control-request-method": "POST" } });
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
  const response = await app.inject({ url: "/api/v1/history", headers: { origin } });
  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["access-control-allow-origin"], origin);
});
