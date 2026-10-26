# Orbit by VidoraHub: connected brand workspace

Next.js → Fastify crawler → MongoDB raw evidence → FastAPI/Gemini → MongoDB analysis → Next.js report.

Read `PROJECT_STATUS.md` for the current project memory, verified checks, deployment URLs and outstanding limitations. Root `AGENTS.md` requires AI sessions to keep that record updated throughout their work.

The implementation follows each app's `docs/ARCHITECTURE.md`. Infrastructure is centralized in Fastify `config/`; crawling lives under `modules/crawlers/`. FastAPI uses matching `routes/analyses.py` and `service/analyses.py`, Pydantic schemas, a provider adapter and a separate prompt. Next.js uses the root `frontend/app/` directory, route-specific components/APIs and independent `http1.ts` / `http2.ts` clients.

## Local setup

1. Start MongoDB locally or obtain an Atlas connection URI.
2. Copy `Backend/.env.example` to `Backend/.env`, `Microservice/.env.example` to `Microservice/.env`, and `frontend/.env.example` to `frontend/.env.local`.
3. Set `MONGODB_URI`, `GEMINI_API_KEY`, and the same random `MICROSERVICE_TOKEN` (at least 32 characters) in both server apps. Also set a separate random `JWT_SECRET` (at least 32 characters) in `Backend/.env`. Generate independent secrets with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Keep them server-side.
4. In `Microservice`, install with `python -m pip install -r requirements-dev.txt`, then run `python -m uvicorn main:app --reload --port 8000`.
5. In `Backend`, run `npm ci`, then `npm run dev` (port 9000).
6. In `frontend`, run `npm ci`, then `npm run dev` and open `http://localhost:3000`.

`GEMINI_MODEL` is configurable and defaults to `gemini-2.5-flash` for this extraction workload. Gemini 3 models are also supported, but must finish within the provider's 90-second timeout. The adapter follows Google's [structured-output REST documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

## API and storage contract

- `POST /api/v1/analyses` on Fastify accepts `{ "startUrl": "https://example.com" }`. Bare domains are normalized to HTTPS. Returns HTTP 202 with `{ "success": true, "data": { "id": "...", "status": "queued" } }`.
- Existing `POST /api/v1/crawlwebsite` remains an alias, but now returns the same asynchronous job contract instead of an immediate scrape. Update older consumers accordingly.
- `GET /api/v1/analyses/:id` returns status, timestamps, page count, sources, discovered social links, warnings, errors and the final `analysis`.
- Statuses: `queued` → `crawling` → `analyzing` → `completed`, or `failed`.
- MongoDB database defaults to `marketing_agency`; collection is `website_analyses`. One document stores the complete raw `scrape` (page text, headings, descriptions, JSON-LD, social links and warnings) before any provider call. The exact persisted scrape is then sent to FastAPI. Final structured analysis is saved on the same document. AI failure retains all scraped evidence.
- FastAPI `POST /api/v1/analyses` requires `X-Service-Token`; it is called by Fastify. The browser never receives this credential. FastAPI does not open a second MongoDB connection.
- Fastify `/health` is liveness; `/ready` checks MongoDB. FastAPI `/health` is liveness after validated startup configuration.

The result includes company name/summary/industry/business model/locations; products, benefits and pricing; audience segments, needs, pain points, buying triggers and suggested channels; value proposition, differentiators and brand voice; content themes; prioritized marketing opportunities; missing information and limitations. Findings carry `basis` (`observed`, `inferred`, `unknown`), `confidence`, and `evidenceUrls`. Pydantic validates output, and service validation rejects citations outside collected pages. Unknown facts remain unknown. Audience hypotheses are not verified customer demographics.

## Workspace, accounts, and activity

The landing-page form and navigation open `/analyze`. A submitted URL starts one job; the resulting `?id=` URL opens that report on refresh. Twelve two-word sidebar sections cover product, audience, voice, past steps, future plans, growth ideas, content themes, research analytics, sources, searches, and activity. Past/future sections edit one shared brief per analysis. User notes stay separate from AI findings and do not regenerate the report.

- `GET /api/v1/auth/me` bootstraps a guest session or returns the signed-in user. Call it before parallel browser requests so they share one identity.
- `POST /api/v1/auth/register` accepts `{name,email,password}`; `POST /api/v1/auth/login` accepts `{email,password}`. Passwords require 12–128 characters and use asynchronous salted scrypt. Emails are normalized and uniquely indexed. Email verification and password recovery are not implemented.
- Both return the safe user, a 15-minute `accessToken` for explicit bearer clients, and an HttpOnly seven-day session JWT cookie. The frontend uses cookies without storing tokens in browser storage. JWT verification fixes HS256 and validates the signature, issuer, audience, expiry, issue time and session ID. Every request checks the persisted session. No refresh tokens are issued.
- `POST /api/v1/auth/logout` revokes that session and starts a fresh guest workspace. Other device sessions remain active. Sign-in/signup rotates the session and transfers the current guest's reports/activity into the account. Logging out does not expose those reports to the new guest.
- All API writes, including bearer clients, require `X-Orbit-Request: 1`. Browser Origin, when present, must exactly match the hardcoded allowlist in `Backend/config/cors.ts`. Credentialed CORS allowlists origins and headers; cross-origin forms cannot supply the custom header.
- Production automatically enables Secure cookies. Prefer same-site frontend/backend deployment with `COOKIE_SAME_SITE=Lax`. Different HTTPS sites require `COOKIE_SAME_SITE=None` and `COOKIE_SECURE=true`; browser third-party-cookie restrictions may still require a same-site proxy. Never expose signing secrets through `NEXT_PUBLIC_` settings.
- `GET /api/v1/history` and `GET /api/v1/activity` return `{items,nextCursor}` with up to 50 owned records. Pass the opaque `?before=` cursor for more; timestamp plus ID avoids losing tied records.
- `POST /api/v1/analyses/:id/brief` saves `{product,audience,pastSteps,futurePlans,goals}`, each at most 4,000 characters. `POST /api/v1/activity` records allowlisted `{analysisId,section}` after checking ownership. Searches and brief updates are recorded server-side. Events link to their report and owner. Arbitrary tracking payloads, client-selected ownership, IPs and fingerprints are not stored.
- MongoDB collections: `users` (unique email/password hash), `sessions` (account/guest identity), `website_analyses` (owner, evidence, analysis, brief) and `user_activity` (owner, event, analysis link, timestamps). Compound owner/time/ID indexes support history. Session TTL removes expired sessions, also rejected immediately by middleware. Activity expires after 90 days. Reports remain until removed operationally; unclaimed guest reports become inaccessible when their session expires. Account-deletion and automated report-retention endpoints are not implemented.
- Website Analytics shows collected pages, social links and evidence-basis/confidence counts. Traffic, revenue and conversion data require an analytics integration and are explicitly unavailable.

## Current boundaries

- Report IDs are identifiers, not access credentials. Production report reads/updates enforce ownership and return 404 for other owners. Legacy ownerless reports remain in MongoDB but are inaccessible through this API; knowing an old link does not automatically claim it. Guest/account transfer uses separate MongoDB updates in this single-process deployment; use transactions or durable reconciliation before distributed identity migration.
- Runs in one backend process, with at most two concurrent jobs, eight attempted pages per job, 2 MB per response, a 75-second crawl budget and a 180-second overall deadline. Jobs are stored durably, but the executor is in-process. A restart marks unfinished jobs failed; it does not resume them. Deploy a single replica; a durable queue and worker leases are required before scaling horizontally. No unused Redis infrastructure is introduced.
- Crawling uses bounded native HTTP requests and Cheerio, rather than the previous request-local Crawlee queue, so every request and redirect pins a checked public DNS answer. This avoids DNS rebinding and shared crawler storage. Private/reserved IPs, credentials, custom ports, unrelated-domain redirects and HTTPS downgrades are rejected. HTTP-to-HTTPS and `www` canonical redirects are accepted.
- `robots.txt` rules are honored, including per-bot groups, wildcard paths and longest matching rules. An unreadable robots policy stops the crawl; a missing policy (404) permits it. The crawler follows HTML links and prioritizes about/product/service/pricing pages. It does not execute JavaScript, bypass anti-bot systems or authentication, scrape social posts, or fetch external social profiles. Social presence means links discovered on crawled pages.
- Gemini receives a simplified generation schema to avoid constrained-decoder complexity limits; the full Pydantic schema and evidence checks still validate its output. Thinking is bounded for predictable latency. Provider retries are deliberately disabled to bound quota use. A failed job can be submitted again. The UI displays specific safe errors for provider authentication, unavailable models, quota, invalid output and timeouts, and supports JSON download.
- Deployment targets remain the existing Zoho Catalyst AppSail apps. Configure the server secrets in Catalyst and set the frontend's public Fastify URL before production deployment. The local MongoDB/localhost defaults are for development.

## Verification

- Backend: `npm run typecheck`, `npm test`, `npm run build`.
- Microservice: `python -m pytest -q`.
- Frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

Tests mock provider calls and persistence; a live end-to-end run also requires reachable MongoDB and valid Gemini credentials.

The workspace uses Orbit's violet/cyan branding with a white sidebar, pale cards and responsive navigation. The requested `https://kukunotes.com/` reference could not be fetched during implementation, so fidelity to that site was not verified.
