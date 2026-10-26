# Project status and AI memory

Last updated: 2026-10-26 (Asia/Kolkata).

## Maintenance rule

Read this file at the start of each task and update it as work progresses and before handing off. Keep verified behavior, configuration contracts, decisions, deployment evidence, limitations and next steps current. Never store secrets here. Root `AGENTS.md` makes this workflow discoverable for future AI sessions.

## Project and architecture

Orbit by VidoraHub is a brand research workspace. Next.js frontend calls Fastify Backend; Backend crawls public websites, persists raw evidence in MongoDB, calls the authenticated FastAPI/Gemini Microservice, and persists its validated structured analysis. Existing app architecture documents are under each app's `docs/ARCHITECTURE.md`; root README documents setup and API contracts.

The checkout contains extensive pre-existing uncommitted and untracked work. Do not reset or overwrite it. No commit was requested.

## Implemented behavior

- Homepage Analyze Website opens `/analyze`; submitting a URL starts a job and replaces the URL with the saved report ID.
- Responsive workspace with twelve two-word navigation sections, source-linked product/audience research, editable shared brand brief, research analytics, search history and activity.
- Accounts: signup/login/logout, salted async scrypt passwords, HttpOnly session JWT cookies, short-lived bearer JWTs and revocable MongoDB sessions. Signing in transfers current guest reports/activity. Ownership protects reports and notes; legacy ownerless reports are inaccessible.
- Credentialed CORS and a custom header plus Origin checks protect writes. No browser token storage. Separate random JWT_SECRET is configured in ignored local Backend/.env.
- MongoDB stores users, sessions, website_analyses and user_activity with ownership links and history indexes. Sessions last seven days; activity TTL is 90 days. Briefs are user-authored context and do not regenerate AI findings.
- Analytics shows research counts and evidence confidence/basis, not live traffic or conversion data. Kukunotes reference was inaccessible; design uses Orbit branding.

## Verification completed before this task

- Backend: 18 tests passed, typecheck and build passed.
- Frontend: lint and production build passed; build includes TypeScript checking.
- Chrome checks with isolated API fixtures passed for landing redirect, single submission, all sidebar sections, research results, brief persistence, analytics/history, signup/logout, desktop/mobile overflow and no runtime exceptions. A mobile grid overflow was found and fixed.
- Live MongoDB/Gemini flow was not reverified in that task. Browser fixture results do not establish a live cloud deployment.

## Latest completed task: memory and AppSail deployment

User explicitly requested this file, ongoing maintenance, platform port variables and deployment of Backend plus Microservice.

- Existing Catalyst project: `marketing-agency`, project ID `81904000000013050`.
- Existing active target in both `.catalystrc` files: Development, environment ID `60091789678`. Preserve this target; Production was not explicitly requested.
- Backend AppSail service: `market-agency-backend`, Node 22, `npm start`, compiled `dist/server.js`.
- Microservice AppSail service: `market-agency`, Python 3.10, dependencies supplied under `packages/`.
- Port contract: `X_ZOHO_CATALYST_LISTEN_PORT` takes priority over `PORT`; bind to `0.0.0.0`. Local defaults: Backend 9000, Microservice 8000.
- Corrected Backend app-config key from `buildPath` to Catalyst's `build_path`.
- Added Microservice `server.py`: platform port, then PORT, then local 8000; validates 1–65535 and binds to 0.0.0.0. Its AppSail command uses this entry point with vendored packages.
- Added/expanded `.catalystignore` files to exclude secrets, tests, docs, caches and temporary artifacts. Linux Python 3.10 dependency binaries already exist under Microservice/packages.
- Verified this task: Backend typecheck, all 18 tests and build passed; Microservice all 26 tests passed (one existing Starlette/httpx deprecation warning).
- Initial restricted deployment failed on credential refresh (EACCES/EPERM); the network-enabled retry authenticated successfully. No user re-login was needed.
- Both source deployments completed successfully. Commands: `catalyst deploy --only appsail:market-agency` from Microservice; `catalyst deploy --only appsail:market-agency-backend` from Backend. Each CLI command returned `DEPLOYMENT SUCCESSFUL` and `Catalyst deploy complete!`.
- Confirmed service metadata through the authenticated CLI API:
  - Backend ID `81904000000019007`: https://market-agency-backend-50046841977.development.catalystappsail.in
  - Microservice ID `81904000000021001`: https://market-agency-50046841977.development.catalystappsail.in
- Added `scripts/configure-appsail.cjs`: uses the installed CLI's authenticated client, restricts itself to the existing Development environment, reads allowlisted local environment values into memory, and updates runtime configuration without writing/printing secrets. Run without `--apply` to inspect service URLs/key names; `--apply` requires authorization to configure secrets.
- Automatic approval review initially rejected runtime secret transfer because deployment authorization alone was deemed insufficient. The user explicitly approved runtime secret configuration for the two Development services, and the approved update completed. Do not infer authorization for future unrelated credential transfers from this record.
- Runtime configuration was applied successfully after explicit user approval. Backend now points to the deployed Microservice; required server-only credentials were set without printing or writing them to source. Secure cookies use SameSite=None; allowed frontend origin remains localhost:3000. Frontend deployment is outside this request.
- After both source deployments, live checks passed: Microservice `/health` 200; Backend `/health` 200; Backend `/ready` 200 (MongoDB ping passed); Backend `/api/v1/history` with an invalid bearer token 401; Backend cross-origin POST `/api/v1/analyses` without the CSRF header 403; Microservice unauthenticated POST `/api/v1/analyses` 401. These checks confirm the new Backend auth middleware is active.
- The approved shared service token was verified against the deployed Microservice: an authenticated empty payload returned the expected 422 validation response, proving authentication succeeded without invoking Gemini or persisting an analysis.
- No real user account, website analysis or paid Gemini generation was created during deployment verification. Provider availability/quota and full real-world analysis remain separate from these health/security checks.
- Frontend remains local and was not deployed. Its local environment URLs were preserved. To use the cloud Backend from the frontend, set its public API URL explicitly and rebuild; the cloud Backend currently allowlists http://localhost:3000.

## Known limitations and follow-up

- In-process crawler executor supports one backend replica; restarts mark unfinished jobs failed. Distributed workers/leases are not implemented.
- Guest/account transfer currently uses separate MongoDB updates; distributed transactional/reconciliation guarantees are not implemented.
- Email verification, password recovery, account deletion and automated report retention are not implemented. Expired unclaimed guest reports remain stored but inaccessible.
- Deployments need server-only MongoDB, Gemini and service-token configuration; Backend additionally needs JWT_SECRET, the deployed Microservice URL and allowed frontend origins. Never expose these secrets in source or this file.
- Configure separate secrets and secure cookie/cross-site settings for Production. Frontend deployment is outside the current request.
