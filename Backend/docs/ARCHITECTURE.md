# ARCHITECTURE.md — Fastify Backend

## 1. Purpose

This document defines the mandatory architecture, folder structure, coding conventions, security requirements, and development workflow for the Fastify backend.

Every developer and AI coding agent must follow this document when creating, modifying, or refactoring backend code.

### Core principles

- `server.ts` is the single application entry point.
- Feature-based modular architecture.
- Strict separation of routes, controllers, middleware, helpers, and infrastructure.
- Centralized database, Redis, and external-service connections.
- Explicit JWT-based and cookie-based authentication strategies.
- Small, focused files with predictable responsibilities.
- Consistent error handling, logging, validation, and security.
- Production-ready configuration and graceful shutdown.
- No duplicated business logic or unnecessary dependencies.

---

## 2. Technology and Runtime

- Runtime: Node.js.
- Framework: Fastify.
- Language: TypeScript.
- Entry point: `server.ts`.
- Module system: follow the existing TypeScript and Node.js configuration consistently.
- Database connections: centralized in `config/`.
- Redis connection: centralized in `config/`.
- Authentication: JWT and secure cookie-based sessions, as required by individual routes.
- Validation: Fastify-compatible request schemas and response schemas.
- Logging: Fastify's structured logging.
- Testing: automated unit, integration, and API tests.

Use the project's existing database drivers, Redis client, and authentication packages. Do not introduce replacements without approval.

---

## 3. Mandatory Root Folder Structure

```text
backend/
│
├── server.ts
│
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.middleware.ts
│   │   └── auth.helper.ts
│   │
│   ├── users/
│   │   ├── users.routes.ts
│   │   ├── users.controller.ts
│   │   ├── users.middleware.ts
│   │   └── users.helper.ts
│   │
│   ├── campaigns/
│   │   ├── campaigns.routes.ts
│   │   ├── campaigns.controller.ts
│   │   ├── campaigns.middleware.ts
│   │   └── campaigns.helper.ts
│   │
│   └── health/
│       ├── health.routes.ts
│       ├── health.controller.ts
│       ├── health.middleware.ts
│       └── health.helper.ts
│
├── config/
│   ├── env.ts
│   ├── database.ts
│   ├── redis.ts
│   ├── jwt.ts
│   ├── cookies.ts
│   ├── cors.ts
│   ├── plugins.ts
│   └── shutdown.ts
│
├── utils/
│   ├── app-error.ts
│   ├── async-handler.ts
│   ├── response.ts
│   ├── logger.ts
│   └── constants.ts
│
├── types/
│   ├── fastify.d.ts
│   ├── auth.ts
│   ├── api.ts
│   └── common.ts
│
├── schemas/
│   ├── common.schema.ts
│   └── pagination.schema.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
│
├── scripts/
│   └── migrate.ts
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
├── Dockerfile
├── README.md
└── ARCHITECTURE.md
```

This is the reference structure. Create only the modules and files needed by the actual project. Do not add empty placeholder files merely to match the tree.

---

## 4. Root Entry Point — `server.ts`

`server.ts` is responsible exclusively for application composition and lifecycle management.

### Allowed responsibilities

1. Create the Fastify application instance.
2. Apply application-wide Fastify settings.
3. Register shared plugins.
4. Configure CORS and security-related plugins.
5. Register feature route modules.
6. Register global error handling.
7. Connect infrastructure through the designated startup lifecycle.
8. Start the HTTP server with `app.listen()`.
9. Handle graceful shutdown and startup failures through centralized lifecycle functions.

### Prohibited responsibilities

`server.ts` must not contain:

- Business logic.
- Database queries.
- Redis commands for individual features.
- Authentication verification implementations.
- User registration or login implementations.
- Feature-specific validation logic.
- Controllers or feature helper functions.
- Inline route handler implementations.
- Hardcoded secrets or credentials.
- Repeated connection setup for individual features.

### Example `server.ts`

```ts
import Fastify from "fastify";

import { env } from "./config/env";
import { registerPlugins } from "./config/plugins";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { registerRoutes } from "./config/routes";
import { registerShutdown } from "./config/shutdown";
import { registerErrorHandler } from "./config/error-handler";

async function startServer() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers['set-cookie']",
      ],
    },
    trustProxy: env.TRUST_PROXY,
  });

  try {
    await registerPlugins(app);
    registerErrorHandler(app);

    await connectDatabase();
    await connectRedis();

    await registerRoutes(app);

    registerShutdown(app);

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
  } catch (error) {
    app.log.error({ err: error }, "Server startup failed");
    await app.close().catch(() => undefined);
    process.exitCode = 1;
  }
}

void startServer();
```

This example illustrates the desired separation of concerns. The referenced configuration modules must be implemented to match the project's actual database, Redis client, plugin lifecycle, route registration, and shutdown requirements.

Do not duplicate shutdown handlers, connection setup, or error handling in multiple files.

---

## 5. Feature-Based Module Architecture

Every business feature must have its own directory under `modules/`.

Examples:

- `modules/auth/`
- `modules/users/`
- `modules/campaigns/`
- `modules/payments/`
- `modules/notifications/`

Each feature uses the same four-file convention.

### 5.1 `module.routes.ts`

Responsibilities:

- Define HTTP methods and endpoint paths.
- Register controllers as route handlers.
- Attach authentication and authorization requirements.
- Apply request and response schemas.
- Apply route-specific middleware or Fastify hooks.
- Configure route-specific rate limits when needed.

Routes must not contain business logic or direct database queries.

### 5.2 `module.controller.ts`

Responsibilities:

- Read validated request parameters, query strings, body, and authenticated identity.
- Call feature helper functions or services.
- Return appropriate HTTP status codes and responses.
- Propagate errors to the centralized error handler.

Controllers should coordinate requests rather than implement the underlying business rules.

### 5.3 `module.middleware.ts`

Responsibilities:

- Implement feature-specific authorization checks.
- Apply permission and ownership checks.
- Perform request checks that are not already handled by schemas.
- Provide reusable Fastify hooks for that module.

Authentication logic that is shared across multiple modules belongs in a centralized authentication module or plugin. Do not copy the same JWT or cookie verification code into every feature.

### 5.4 `module.helper.ts`

Responsibilities:

- Implement feature-specific business operations.
- Coordinate database and Redis operations through their designated clients.
- Apply feature rules and data transformations.
- Return typed results or throw defined application errors.

Helpers must not depend on Fastify's request and reply objects unless the operation specifically requires framework context.

If a helper grows too large, introduce a focused `module.service.ts` or `module.repository.ts` when justified. Keep the four-file convention as the starting point, not a reason to combine unrelated responsibilities.

---

## 6. Standard Feature Request Flow

```text
Incoming HTTP request
        |
        v
Fastify application plugins
        |
        v
Feature routes
        |
        v
Authentication / authorization
        |
        v
Request validation
        |
        v
Controller
        |
        v
Feature helper / service
        |
        v
Database / Redis / external service
        |
        v
Controller response
        |
        v
Client
```

The precise order of authentication and validation should be configured deliberately for each route, especially when authentication is required before sensitive operations.

### Mandatory rules

- All feature endpoints must be registered through their route module.
- All route modules must be registered through the central route registry.
- Controllers must not be registered directly from `server.ts`.
- Database access must use the established database connection.
- Redis access must use the established Redis connection.
- Errors must follow the global error-handling contract.
- Authentication must never be bypassed merely because a request originates from the frontend.

---

## 7. Centralized Route Registration

Create `config/routes.ts` to register all feature modules.

Example:

```ts
import type { FastifyInstance } from "fastify";

import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import campaignsRoutes from "../modules/campaigns/campaigns.routes";
import healthRoutes from "../modules/health/health.routes";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes, {
    prefix: "/api/v1/health",
  });

  await app.register(authRoutes, {
    prefix: "/api/v1/auth",
  });

  await app.register(usersRoutes, {
    prefix: "/api/v1/users",
  });

  await app.register(campaignsRoutes, {
    prefix: "/api/v1/campaigns",
  });
}
```

The registry is the single place to coordinate feature route registration and API version prefixes.

Do not register the same route module twice or define the same endpoint in multiple modules.

Use a consistent URL naming convention and avoid exposing internal folder names as public API paths unless that is intentional.

---

## 8. Authentication Architecture

The backend supports two authentication mechanisms:

1. JWT-based authentication.
2. Cookie-based authentication.

These are two authentication strategies, not automatically two-factor authentication. If the product requires actual two-factor authentication, implement it as a separate security flow.

### 8.1 JWT-based authentication

Use JWT authentication for routes and clients that explicitly use bearer tokens.

Example request:

```http
Authorization: Bearer <access_token>
```

Responsibilities:

- Issue tokens only after successful authentication.
- Verify token signatures and allowed algorithms.
- Validate expiration, issuer, audience, and other required claims.
- Validate the authenticated identity and relevant permissions.
- Reject missing, malformed, invalid, and expired tokens.
- Keep signing keys in secure environment configuration or a secret manager.
- Use short-lived access tokens where appropriate.
- Define refresh-token rotation and revocation policies if refresh tokens are used.

Do not trust user IDs or roles supplied directly by the request body when determining identity or authorization.

### 8.2 Cookie-based authentication

Use cookie-based sessions or tokens only on routes explicitly designed for this strategy.

For session-based authentication:

- Store session state in the configured session store when persistence and revocation are required.
- Use unpredictable session identifiers.
- Regenerate session identifiers after authentication or privilege changes.
- Invalidate sessions on logout.
- Use `HttpOnly`, `Secure` in production, and an appropriate `SameSite` policy.
- Configure cookie domain, path, and expiration deliberately.
- Implement CSRF protection when required by the cookie authentication model.

For signed-token cookies, validate the token exactly as required by the token format and never assume that placing a JWT inside a cookie automatically creates a secure session.

### 8.3 Avoid authentication conflicts

- Every protected route must explicitly declare its authentication strategy.
- Do not silently accept either JWT or cookies on every protected route.
- Do not accidentally authenticate one user through a bearer token and another through a cookie on the same request.
- If a route supports both strategies, define explicit precedence and conflict handling.
- Keep authorization separate from authentication.
- Do not store passwords, raw access tokens, or session secrets in logs.
- Keep cookie signing secrets separate from JWT signing keys unless an explicit, reviewed design says otherwise.

### Suggested authentication files

```text
modules/auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.middleware.ts
└── auth.helper.ts

config/
├── jwt.ts
└── cookies.ts

types/
└── auth.ts
```

The configuration files define and initialize the relevant security mechanisms; the auth module owns feature-specific login, logout, and session operations.

---

## 9. Centralized Configuration — `config/`

The `config/` directory contains infrastructure setup and application-wide configuration.

### `config/env.ts`

- Read and validate environment variables at startup.
- Define required and optional variables.
- Apply safe defaults only where appropriate.
- Fail startup when required configuration is missing or invalid.
- Keep secrets out of source control.

### `config/database.ts`

- Initialize the chosen database client.
- Export a shared connection or client.
- Handle connection failures and reconnection according to the driver's capabilities.
- Provide a centralized close operation.
- Avoid opening a new database connection for every request.

### `config/redis.ts`

- Initialize the shared Redis client.
- Configure connection settings and appropriate timeouts.
- Handle connection errors and reconnect behavior.
- Export the shared client.
- Provide a clean shutdown operation.

### `config/jwt.ts`

- Configure the JWT signing and verification strategy.
- Define supported algorithms and validation options.
- Keep signing keys and other sensitive configuration secure.

### `config/cookies.ts`

- Configure cookie registration and security defaults.
- Define the project's cookie policy.
- Keep cookie signing configuration separate from unrelated secrets.

### `config/cors.ts`

- Define allowed origins.
- Configure allowed methods, headers, and credential support.
- Use an explicit production origin allowlist.
- Never combine wildcard origins with credentialed browser requests.

### `config/plugins.ts`

- Register shared Fastify plugins.
- Register CORS, cookie, authentication, and other common plugins in the required order.
- Avoid registering the same plugin repeatedly across feature modules unless encapsulation is intentional.

### `config/shutdown.ts`

- Register graceful shutdown behavior.
- Stop accepting new traffic.
- Close the Fastify server.
- Close database and Redis connections.
- Handle shutdown failures and avoid duplicate shutdown execution.

### `config/error-handler.ts`

- Define the global Fastify error handler.
- Normalize expected application errors.
- Prevent internal stack traces and sensitive details from reaching clients.
- Log unexpected errors with appropriate context.

Configuration modules must not contain feature-specific business logic.

---

## 10. Global Utilities — `utils/`

The `utils/` folder contains framework-independent functions used across multiple features.

Examples:

- `app-error.ts`: standard application error types.
- `async-handler.ts`: only if a reusable async wrapper is actually required by the implementation.
- `response.ts`: common response formatting helpers, if the project uses a standard envelope.
- `logger.ts`: logging helpers that build on the configured logger.
- `constants.ts`: genuinely global constants.

### Utility rules

1. Utilities must be reusable across multiple modules.
2. Do not place user-specific business rules in global utilities.
3. Do not create a utility for a function used only once unless it provides a meaningful abstraction.
4. Do not create duplicate versions of the same utility.
5. Avoid global mutable state.
6. Prefer pure functions where possible.
7. Use explicit parameter and return types.
8. Do not hide database or network side effects inside functions that appear to be simple formatting utilities.

---

## 11. Database and Redis Access Rules

- Use the established connection from `config/database.ts` or `config/redis.ts`.
- Do not instantiate a separate database client inside each controller.
- Keep data-access logic inside the owning module's helper, service, or repository.
- Use transactions where supported and required for data consistency.
- Validate inputs before executing database operations.
- Use parameterized queries or the database driver's safe query mechanisms.
- Define appropriate indexes and query patterns.
- Apply timeouts and bounded operations to prevent resource exhaustion.
- Handle connection loss and shutdown cleanly.
- Do not expose raw database errors to API clients.
- Use migrations or the project's established schema-management process for structural changes.

A repository layer is optional at the start. Introduce `module.repository.ts` when data access becomes complex or needs independent testing; do not create redundant layers for every trivial query.

---

## 12. Validation and API Contracts

All external inputs are untrusted.

- Validate request bodies, query strings, path parameters, and headers where relevant.
- Use shared schemas when multiple modules genuinely need the same contract.
- Define route response schemas where practical.
- Reject invalid data with consistent client errors.
- Do not rely solely on TypeScript types for runtime validation.
- Avoid leaking sensitive fields from database objects.
- Keep API request and response contracts documented and versioned.

Do not invent endpoint contracts when an existing frontend, API specification, or backend implementation already defines them.

---

## 13. File Size and Coding Standards

The project should remain easy for both humans and AI agents to understand.

### File size policy

- Target: 100 lines or fewer per source file.
- Hard guideline: 120 lines maximum.
- If a file exceeds 120 lines, refactor it before extending it further.
- Document any necessary exception for framework configuration or a cohesive implementation that cannot reasonably be split.

The line count includes imports, types, comments, implementation, and exports.

Do not split files into meaningless fragments merely to satisfy a number. Each file must have a clear responsibility.

### Naming conventions

| Item | Convention | Example |
|---|---|---|
| Module folders | lowercase | `users/` |
| Route files | module name | `users.routes.ts` |
| Controller files | module name | `users.controller.ts` |
| Middleware files | module name | `users.middleware.ts` |
| Helper files | module name | `users.helper.ts` |
| Configuration files | descriptive lowercase | `database.ts` |
| Types | descriptive names | `auth.ts` |
| Functions | camelCase | `getUserById` |
| Classes and error types | PascalCase | `AppError` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |

### TypeScript rules

- Keep strict TypeScript checks enabled.
- Avoid `any`; use `unknown` where appropriate.
- Explicitly type public function parameters and return values.
- Avoid circular module dependencies.
- Keep imports predictable and consistent.
- Avoid unnecessary type assertions and non-null assertions.
- Do not mix incompatible module systems.
- Do not introduce dependencies without approval.

---

## 14. Error Handling and Logging

Use one predictable error-handling strategy across the application.

### Expected errors

Examples include:

- Invalid request.
- Unauthenticated request.
- Forbidden operation.
- Resource not found.
- Resource conflict.
- Rate limit exceeded.

Map expected errors to appropriate HTTP status codes.

### Unexpected errors

- Log the error through Fastify's configured logger.
- Include a request ID where available.
- Return a safe, consistent error response.
- Never expose stack traces, credentials, internal file paths, or database details to clients in production.

### Logging rules

- Use structured logs rather than arbitrary console statements.
- Redact authorization headers, cookies, passwords, tokens, and sensitive personal information.
- Avoid duplicate logging of the same exception at every layer.
- Include enough context to diagnose operational failures without exposing secrets.

---

## 15. Production Readiness Requirements

### Security

- Strict environment validation.
- Secure authentication and authorization.
- CORS allowlisting.
- Appropriate cookie and CSRF policies.
- Rate limiting for sensitive and abuse-prone endpoints.
- Request size limits.
- Input validation.
- Safe response serialization.
- Dependency vulnerability checks.
- HTTPS at the deployment boundary.
- No hardcoded secrets.

### Reliability

- Graceful startup and shutdown.
- Database and Redis connection lifecycle management.
- Timeouts for external operations.
- Appropriate retry policies.
- Health and readiness endpoints.
- Structured logging and request IDs.
- Defined behavior when a required dependency is unavailable.

### Performance

- Avoid unnecessary database queries.
- Use indexes and efficient pagination.
- Reuse shared connections.
- Bound expensive operations.
- Avoid blocking the Node.js event loop.
- Monitor latency, memory, CPU, and error rates.
- Use caching only when invalidation and consistency requirements are understood.

### Health checks

Keep liveness and readiness checks conceptually separate.

- **Liveness:** indicates whether the application process is functioning.
- **Readiness:** indicates whether the application can safely serve requests, considering required dependencies.

Do not expose secrets, detailed infrastructure information, or internal connection strings through health endpoints.

---

## 16. Testing Requirements

Use the existing project testing framework and conventions.

### Unit tests

Test business helpers, validation logic, permission checks, and utility functions independently.

### Integration tests

Test route registration, authentication, request validation, error responses, and database interactions.

### Security tests

Verify that:

- Protected routes reject missing credentials.
- Invalid and expired JWTs are rejected.
- Cookie authentication follows the configured session or token policy.
- Unauthorized users cannot access other users' resources.
- CSRF protections work where required.
- Invalid inputs do not reach unsafe database operations.
- Sensitive information is not returned or logged.

Use isolated test configuration and test data. Do not run destructive tests against production resources.

---

## 17. AI Coding Agent Rules

Every AI coding agent must follow these mandatory instructions:

1. Read `ARCHITECTURE.md` before making architectural changes.
2. Inspect the existing root directory and relevant modules before creating files.
3. Use `server.ts` only for application composition and lifecycle orchestration.
4. Register endpoints through `config/routes.ts`.
5. Put feature routes, controllers, middleware, and helpers in the corresponding module directory.
6. Use the shared database and Redis connections.
7. Never duplicate JWT or cookie verification logic across features.
8. Declare the authentication strategy for every protected route.
9. Keep files focused and refactor files that exceed the size guideline.
10. Reuse established validation, error handling, and logging patterns.
11. Never invent environment variables, database schemas, API contracts, or authentication rules without verifying the project.
12. Do not introduce a dependency without approval.
13. Do not remove existing behavior without understanding its dependencies.
14. Add or update tests for behavior changes.
15. Run available type checks, linting, and tests before reporting completion.
16. Update this document when an approved architectural change alters the conventions.

If a requirement cannot be followed safely, explain the reason and propose the smallest justified deviation.

---

## 18. Definition of Done

Before a feature is considered ready for review, verify:

- [ ] The feature follows the established module structure.
- [ ] Routes contain no business logic.
- [ ] Controllers coordinate requests without directly owning infrastructure setup.
- [ ] Business operations reside in focused helpers, services, or repositories.
- [ ] The appropriate authentication and authorization are applied.
- [ ] Inputs and outputs follow the established API contracts.
- [ ] Database and Redis access use centralized connections.
- [ ] Errors and logs follow the shared conventions.
- [ ] No secrets or sensitive details are exposed.
- [ ] Files follow the size guideline or have a justified exception.
- [ ] Tests, linting, and TypeScript checks pass.
- [ ] Relevant documentation is updated.

---

## 19. Architecture Change Policy

This document is the source of truth for the Fastify backend architecture.

New modules must follow the same conventions. Existing code should be refactored incrementally without breaking established API contracts.

Changes to the entry point, authentication strategy, connection lifecycle, module conventions, or error-handling architecture must be deliberate and documented.

The objective is a backend that remains maintainable, secure, testable, and consistent as the number of modules and AI-generated changes grows.

## Website research implementation

`config/application.ts` composes plugins, MongoDB, the crawler service and the route registry; `server.ts` only starts the app. `config/database.ts` owns the MongoDB client, and `config/microservice.ts` owns authenticated FastAPI calls. The existing `MONGO_URI` is supported alongside `MONGODB_URI`.

`modules/crawlers/` separates routes, controllers, public-network validation, fetching, extraction, crawl orchestration, persistence and job coordination. Raw evidence is committed before FastAPI is called. Production report reads enforce account/guest ownership installed by the auth middleware. Report IDs alone do not grant access; legacy ownerless reports cannot be claimed by knowing their IDs.

The current job executor supports one backend replica; unfinished jobs become failed on restart. It intentionally does not introduce unused Redis infrastructure. See the root README for contracts, security boundaries and setup.

`modules/auth/` owns registration, salted async scrypt, login, revocable MongoDB sessions, identity hooks, and guest/account transfer. `config/jwt.ts` implements a fixed HS256 JWT profile with native Node crypto, without new dependencies. Cookie and bearer strategies share the persisted session. `config/cookies.ts` centralizes cookie policy; environment validation requires an independent signing secret. All API writes require the custom CSRF header and an allowlisted Origin when present. `config/plugins.ts` owns credentialed CORS and rate limiting.

`modules/workspace/` owns history, allowlisted activity, report ownership, and brief persistence. Cursors use timestamp and ID for stable pagination. Shared MongoDB connections, typed collections, indexes and TTLs stay in `config/database.ts`. The root README documents all new contracts, retention and deployment requirements.

Crawler DNS validation selects a public answer and pins it for the HTTP connection, preferring IPv4 when available. DNS64's well-known `64:ff9b::/96` prefix is supported only when its embedded IPv4 destination is public. Private/reserved answers are never selected, even when a hostname also returns public answers; every redirect is validated again.

CORS origins are hardcoded in `config/cors.ts`: `https://orbit.vidorahub.com` and `http://localhost:3000`. Both middleware and CSRF Origin validation use this list; environment settings cannot override it.
