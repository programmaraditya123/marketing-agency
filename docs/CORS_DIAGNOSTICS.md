# Orbit CORS diagnostics

Date: 2026-10-26. Frontend origin: `https://orbit.vidorahub.com`.

## Confirmed

- Frontend JavaScript calls `https://market-agency-backend-50046841977.development.catalystappsail.in/api/v1`.
- Both apps are deployed to Catalyst project marketing-agency, Development environment 60091789678.
- Runtime CORS_ORIGINS includes the exact Orbit HTTPS origin without a trailing slash, plus localhost:3000. Both apps have explicit credentialed CORS and retain authentication.
- In application-managed mode, live GET /health responses have one Access-Control-Allow-Origin header with the exact Orbit origin, and Access-Control-Allow-Credentials: true.
- Live OPTIONS preflights receive empty HTTP 200 responses from ZGS without Access-Control-Allow-Origin, Access-Control-Allow-Credentials, allowed methods or allowed headers. This differs from tested native Fastify/ASGI preflight behavior and is consistent with gateway interception. No application request-log correlation was available.
- Network-enabled isolated Chrome reproduced `PreflightMissingAllowOriginHeader` from the real Orbit origin. The independent httpbin OPTIONS control returned correct CORS headers, ruling out a client-wide OPTIONS restriction.
- Referrer Policy `strict-origin-when-cross-origin` is normal browser metadata, not the error.
- User states the domain is already enabled in Authorized Domains. Its exact stored value, CORS toggle, selected project/environment and effective gateway rule were not independently inspected.

## Tested configuration

1. Exact origin added to both runtime configurations, examples and defaults; credentials/settings preserved.
2. Explicit Fastify and FastAPI CORS regression tests pass, including auth-error headers and lookalike-domain denial.
3. Both services redeployed successfully with the app CORS fix.
4. Per official AppSail guidance, tested platform-only CORS by setting CORS_MANAGED_BY_CATALYST=true and suppressing framework headers. Microservice normal-response headers disappeared, while gateway preflight headers remained missing. Reverted the runtime flag to false on both services; this experiment did not solve the issue.
5. Platform-mode compatibility code retains JWT/service-token and Backend CSRF checks. Keep platform mode false until gateway CORS is confirmed working.

## Minimal reproduction

Run without credentials or private data:

```sh
curl -i -X OPTIONS "https://market-agency-backend-50046841977.development.catalystappsail.in/api/v1/auth/me" -H "Origin: https://orbit.vidorahub.com" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: content-type,x-orbit-request"
```

Expected: successful preflight with exact allow-origin, allow-credentials true, GET allowed and both requested headers allowed. Observed: HTTP 200 with none of those CORS headers.

## Next required evidence

Inspect the Authorized Domains entry and environment selector in the marketing-agency Catalyst console, specifically Development. Confirm the exact HTTPS origin and CORS toggle (not only iFrame). If these match, reapply the entry or investigate the gateway rule with Catalyst support. No support message has been sent. The installed CLI can deploy and manage runtime configuration but exposes no Authorized Domains operation; public API probes and plugin discovery did not provide that capability.

Official references:

- https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/whitelisting/authorized-domains/introduction/
- https://github.com/catalystbyzoho/agent-skills/blob/main/skills/catalyst-appsail/references/appsail-crossorigin.md

Latest verification (2026-10-26): user requested hardcoded origins. Backend/config/cors.ts and Microservice/config/cors.py now always allow https://orbit.vidorahub.com and http://localhost:3000; environment flags cannot disable or change them. Both Development services were successfully redeployed. All 49 tests pass; normal health/auth error responses have correct credentialed CORS, but public OPTIONS on both services still returns empty 200 without CORS headers. The existing gateway preflight issue persists after these source changes.

Same-origin resolution prepared: Orbit is hosted on Vercel (user confirmed). The frontend browser client now uses /api/v1; next.config.ts proxies to the server-side ORBIT_BACKEND_URL, accepting the existing NEXT_PUBLIC_FASTIFY_API_URL as fallback. Set the upstream to https://market-agency-backend-50046841977.development.catalystappsail.in/api/v1 and redeploy the Vercel frontend. The browser will use https://orbit.vidorahub.com/api/v1/auth/me, so its requests no longer depend on Catalyst CORS preflights and its HttpOnly cookie becomes first-party. Next proxy integration, lint, typecheck and production build passed. The public Vercel deployment has not been updated by this session; deployment access is unavailable.
