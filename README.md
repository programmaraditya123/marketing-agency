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

The landing-page form and navigation open `/analyze`. A submitted URL starts one job; the resulting `?id=` URL opens that report on refresh. Two-word sidebar sections cover product, audience, voice, past steps, future plans, growth ideas, content themes, research analytics, sources, searches, and activity. Past/future sections edit one shared brief per analysis. User notes stay separate from AI findings and do not regenerate the report.

- `GET /api/v1/auth/me` bootstraps a guest session or returns the signed-in user. Call it before parallel browser requests so they share one identity.
- `POST /api/v1/auth/register` accepts `{name,email,password}`; `POST /api/v1/auth/login` accepts `{email,password}`. Passwords require 12–128 characters and use asynchronous salted scrypt. Emails are normalized and uniquely indexed. Email verification and password recovery are not implemented.
- Both return the safe user, a 15-minute `accessToken` for explicit bearer clients, and an HttpOnly seven-day session JWT cookie. The frontend uses cookies without storing tokens in browser storage. JWT verification fixes HS256 and validates the signature, issuer, audience, expiry, issue time and session ID. Every request checks the persisted session. No refresh tokens are issued.
- `POST /api/v1/auth/logout` revokes that session and starts a guest session on the same persistent visitor ID. Other device sessions remain active. Sign-in/signup rotates the session and transfers the current guest's reports/activity into the account. Logging out does not expose those reports to the new guest.
- All API writes, including bearer clients, require `X-Orbit-Request: 1`. Browser Origin, when present, must exactly match the hardcoded allowlist in `Backend/config/cors.ts`. Credentialed CORS allowlists origins and headers; cross-origin forms cannot supply the custom header.
- Production automatically enables Secure cookies. Prefer same-site frontend/backend deployment with `COOKIE_SAME_SITE=Lax`. Different HTTPS sites require `COOKIE_SAME_SITE=None` and `COOKIE_SECURE=true`; browser third-party-cookie restrictions may still require a same-site proxy. Never expose signing secrets through `NEXT_PUBLIC_` settings.
- `GET /api/v1/history` and `GET /api/v1/activity` return `{items,nextCursor}` with up to 50 owned records. Pass the opaque `?before=` cursor for more; timestamp plus ID avoids losing tied records.
- `POST /api/v1/analyses/:id/brief` saves `{product,audience,pastSteps,futurePlans,goals}`, each at most 4,000 characters. `POST /api/v1/activity` records allowlisted `{analysisId,section}` after checking ownership. Searches and brief updates are recorded server-side. Events link to their report and owner. Arbitrary tracking payloads, client-selected ownership, IPs and fingerprints are not stored.
- MongoDB collections: `users` (unique email/password hash), `sessions` (account/guest identity), `website_analyses` (owner, evidence, analysis, brief) and `user_activity` (owner, event, analysis link, timestamps) and `visitors` (persistent browser identity and account linkage). Compound owner/time/ID indexes support history. Session TTL removes expired sessions, also rejected immediately by middleware. Activity expires after 90 days. Reports remain until removed operationally; guest sessions can be renewed while the signed visitor proof remains valid; clearing or losing all proof does not allow ID-only recovery. Account-deletion and automated report-retention endpoints are not implemented.
- Website Analytics shows collected pages, social links and evidence-basis/confidence counts. Traffic, revenue and conversion data require an analytics integration and are explicitly unavailable.

## Current boundaries

- Report IDs are identifiers, not access credentials. Production report reads/updates enforce ownership and return 404 for other owners. Legacy ownerless reports remain in MongoDB but are inaccessible through this API; knowing an old link does not automatically claim it. Guest/account transfer uses separate MongoDB updates in this single-process deployment; use transactions or durable reconciliation before distributed identity migration.
- Runs in one backend process, with at most two concurrent jobs, eight attempted pages per job, 2 MB per response, a 75-second crawl budget and a 180-second overall deadline. Jobs are stored durably, but the executor is in-process. A restart marks unfinished jobs failed; it does not resume them. Deploy a single replica; a durable queue and worker leases are required before scaling horizontally. No unused Redis infrastructure is introduced.
- Crawling uses bounded native HTTP requests and Cheerio, rather than the previous request-local Crawlee queue, so every request and redirect pins a checked public DNS answer. This avoids DNS rebinding and shared crawler storage. Private/reserved IPs, credentials, custom ports, unrelated-domain redirects and HTTPS downgrades are rejected. HTTP-to-HTTPS and `www` canonical redirects are accepted.
- `robots.txt` rules are honored, including per-bot groups, wildcard paths and longest matching rules. An unreadable robots policy stops the crawl; a missing policy (404) permits it. The crawler follows HTML links and prioritizes about/product/service/pricing pages. It does not execute JavaScript, bypass anti-bot systems or authentication, scrape social posts, or fetch external social profiles. Social presence means links discovered on crawled pages.
- Gemini receives a simplified generation schema to avoid constrained-decoder complexity limits; the full Pydantic schema and evidence checks still validate its output. Thinking is bounded for predictable latency. Provider retries are deliberately disabled to bound quota use. A failed job can be submitted again. The UI displays specific safe errors for provider authentication, unavailable models, quota, invalid output and timeouts, and supports JSON download.
- Deployment targets remain the existing Zoho Catalyst AppSail apps. Configure the server secrets in Catalyst and configure ORBIT_BACKEND_URL (including /api/v1) for the frontend same-origin proxy before deployment. The local MongoDB/localhost defaults are for development.

## Verification

- Backend: `npm run typecheck`, `npm test`, `npm run build`.
- Microservice: `python -m pytest -q`.
- Frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

Tests mock provider calls and persistence; a live end-to-end run also requires reachable MongoDB and valid Gemini credentials.

The workspace uses Orbit's violet/cyan branding with a white sidebar, pale cards and responsive navigation. The requested `https://kukunotes.com/` reference could not be fetched during implementation, so fidelity to that site was not verified.

## Competitor discovery

After a report completes, open Competitor Search and select Find Competitors. Backend sends the saved website URL and business analysis to Microservice, which asks Gemini directly for the top ten relevant competitors. Each suggestion includes a company name, official website URL and short description. There is no keyword-generation request, Google search, browser runtime or web-grounding tool. Suggestions are AI-generated and not verified live; Detailed Analysis reuses the existing website-evidence crawler.

- POST /api/v1/analyses/:id/competitors starts generation (202); GET on the same URL reads queued/generating/completed/failed state, provider=gemini, results and warnings. Failures are retryable, and completed Gemini results are reused.
- POST /api/v1/analyses/:id/competitors/:candidateId/analysis starts or reopens the linked detailed report. Request bodies are empty; callers cannot inject a URL or owner. Child reports retain parentAnalysisId/competitorId and appear in owner-scoped history.
- Private Microservice POST /api/v1/competitors/suggestions requires X-Service-Token. It validates the business context and structured Gemini response containing competitors with name, website and description. No new credentials are required.

Backend rejects unsafe/malformed URLs, deduplicates registrable domains, excludes the original business, and caps suggestions at ten. The prompt requests ten real competitors; fewer valid suggestions are shown with an explanation rather than fabricated entries. AI-generated website URLs can be inaccurate; detailed crawling still performs public-network/SSRF validation.

State is saved in website_analyses.competitors. Legacy Google results are hidden from this new flow and replaced only when the owner requests Gemini suggestions; existing child reports are preserved. Idempotent child actions, ownership, JWT/cookies, CSRF and activity tracking remain enforced. One generation runs per backend process with a two-minute deadline; restarts mark pending generations failed. Backend AppSail memory is restored to 512 MB. No Chromium executable, browser binaries or browser runtime dependencies are required.

## Visitor identity and website history

The frontend creates a cryptographically random 256-bit visitorId and keeps it under orbit_visitor_id in localStorage. Auth bootstrap sends X-Orbit-Visitor-Id and receives the server-confirmed ID. Backend stores it in a visitors document and issues a separately signed HttpOnly orbit_visitor proof cookie (one-year rolling browser lifetime). The public ID is metadata, not authorization: if an existing ID is presented without valid proof or a valid existing session, Backend assigns a new visitor identity. Clearing all cookies cannot recover private guest history from a copied localStorage ID alone. No account token is stored in localStorage.

Every new report, activity and session contains visitorId and userId (null for guests). A user document stores userId, the latest visitorId and unique visitorIds across signed-in devices. On signup/login, current guest reports/activity are assigned userId while retaining their original visitorId, and added to the account owner. History is queried by authenticated owner, never by a client-supplied userId or visitorId. Signing out retains the browser visitor ID but does not expose already-claimed account records to the guest. A valid legacy session is upgraded on use; legacy records are attributed when that identity is established or the account signs in, without a global data rewrite. Historical legacy origins cannot be reconstructed, so first binding supplies their visitor attribution.

- GET /api/v1/history/guest: visitor-scoped website history, including across session renewal when visitor proof remains valid. Signed-in callers use account history instead (409).
- GET /api/v1/history/user: signed-in account history across linked visits/devices; anonymous callers receive 401.
- GET /api/v1/history: compatible endpoint choosing the current authenticated owner.
- All history endpoints accept limit=1..50 (default 50) and an opaque before cursor. Responses contain scope, pageSize, hasMore, nextCursor and items with id, website/startUrl, website-or-competitor type, status, dates and optional parentAnalysisId. Raw scrape/analysis data and identity fields are excluded.

The frontend requests twenty history items at a time and shows numbered analyzed websites, report type/status, dates and report links. Compound owner/createdAt/id indexes and limit+1 keyset queries avoid full-history arrays, skip offsets and unbounded response sizes. userId/visitorId indexes support record mapping; the visitors collection has its normal unique _id. Guest/account linking uses idempotent indexed updates in the existing single-replica model, not a distributed transaction. Histories live in their own report/activity collections, rather than inside the users document.

### Product demand research
After a website report completes, open Market Demand, review up to five product-category terms, choose worldwide or a two-letter country code and a 3-month/12-month/5-year window, then select Research Demand. The owner-scoped GET/POST /api/v1/analyses/:id/market-research endpoints start and poll asynchronous collection. MongoDB website_analyses.marketResearch stores config, timestamps, raw Google Trends evidence before Gemini, then the structured interpretation. Parent userId/visitorId and existing guest-to-account linking apply. Collected data survives interpretation failure and is reused on retry. One immutable completed dataset is retained per report; use a new report for different inputs. Research starts are also saved in private activity history.
The Python dependency is pytrends 4.9.2 (unofficial, archived). Install Microservice/requirements.txt in the service environment; Linux-compatible packages are vendored for AppSail. Google may rate limit or change endpoints. Failed collection is shown explicitly; no synthetic data is substituted. Complete periods only are used, regional/query failures become warnings, and half-period comparisons share one normalized dataset. Scores measure relative search interest (0�100), never absolute search volume, sales, market size or proof of purchasing demand. Collection concurrency is one per process with bounded requests; the Backend executor still requires one replica. No new secrets or port configuration are required.

### Budget-aware marketing channels
Open Marketing Plan after a website analysis, choose a currency, enter daily and monthly budgets, and select Find Marketing Channels. The private Gemini workflow uses the saved product/audience and any collected Trends data. It returns focused channels, why each fits, when to start, actions, success metrics and scale/stop criteria. GET/POST /api/v1/analyses/:id/marketing-plan are asynchronous and owner-scoped. MongoDB saves inputs before generation and results afterward; guest/account ownership and activity mapping apply.
A 30-day planning window uses the lower of monthly budget or daily budget ? 30. Daily pacing is capped at one thirtieth of that amount. Currency amounts round down to minor units; percentages at most 100 leave a reserve. Either budget can be zero for a plan without paid media. INR/USD/EUR/GBP/AUD/CAD/SGD/AED and two decimal places are supported. These are planning allocations, not platform minimums or guaranteed results. No campaigns launch automatically. Change budgets to regenerate; one previous successful plan is retained if updates fail.
