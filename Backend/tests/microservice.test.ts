import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyzer } from "../config/microservice";
import type { Environment } from "../config/env";
const env: Environment = { port: 9000, host: "127.0.0.1", mongoUri: "", mongoDatabase: "test",
  microserviceUrl: "http://127.0.0.1:8000", serviceToken: "test-token", corsOrigins: [], jwtSecret: "test-secret".repeat(4), cookieSecure: false, cookieSameSite: "Lax", corsManagedByCatalyst: false };
const scrape = { startUrl: "https://example.com", pages: [], socialLinks: [], warnings: [] };
test("preserves specific provider failure without forwarding arbitrary provider text", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ code: "GEMINI_TIMEOUT", message: "secret detail" }), { status: 504 }));
  await assert.rejects(createAnalyzer(env)(scrape, AbortSignal.timeout(1000)), /Gemini analysis timed out/);
});
test("does not expose unrecognized microservice errors", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ code: "UNRECOGNIZED", message: "secret detail" }), { status: 500 }));
  await assert.rejects(createAnalyzer(env)(scrape, AbortSignal.timeout(1000)), error =>
    error instanceof Error && !error.message.includes("secret detail") && error.message.includes("scraped data has been saved"));
});
