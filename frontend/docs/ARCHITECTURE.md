# ARCHITECTURE.md

## Orbit branding and public pages

The frontend is **Orbit by VidoraHub**, with canonical production URL `https://orbit.vidorahub.com`. Shared identity and SEO values live in `config/site.ts`. Navbar/footer identity uses `components/layout/Brand.tsx` and the supplied Orbit logo in `public/brand/`; favicon and app icons use the App Router metadata conventions. Do not replace the supplied logo with a placeholder.

The homepage remains `app/page.tsx`; `app/how-it-works/page.tsx` owns the separate process page and its route-specific components. Public-page canonical URLs, Open Graph/Twitter previews, homepage structured data, `app/robots.ts`, `app/sitemap.ts`, and `app/manifest.ts` use the same production identity. Existing job recovery reads the old storage key for compatibility while new jobs use `orbit-analysis`.

Brand/audience analysis is currently available. Competitor research, internet trends, generation prompts, and banner/poster tools must be labeled as planned until their backend workflows are implemented.

The brand blueprint is a summary with grouped heading bubbles. `app/components/blueprint/topics.ts` builds typed topics from the existing analysis response, and `BlueprintDetails.tsx` renders their complete details. Selecting a bubble opens the shared native dialog in `components/ui/Modal.tsx`, which supports focus trapping/restoration, Escape, backdrop dismissal and scroll locking. Keep evidence, source links, inference labels, unknown facts, empty states and JSON export accessible when adding or changing topics.

The website research feature uses `app/page.tsx` for composition, `app/components/` for its UI, `app/api/analyses.ts` for feature requests and `app/hooks/useAnalysis.ts` for submission/polling. The shared navbar is mounted in `app/layout.tsx`. Both HTTP clients are configured independently; the analysis feature uses `http1.ts` because Fastify owns persistence and service credentials. `http2.ts` is reserved for browser-safe microservice endpoints, and never receives the private service token.

## 1. Purpose

This document defines the mandatory frontend architecture for the Next.js project.

Every developer and AI coding agent must follow these conventions when creating, modifying, or refactoring code.

### Core principles

- Route-based folder organization.
- Small, reusable, single-responsibility components.
- Strict separation of UI, API requests, business logic, and shared utilities.
- Two independent backend communication clients.
- Tailwind CSS for styling.
- Consistent naming conventions and predictable file locations.
- No unnecessary abstractions, duplicated code, or oversized files.

---

## 2. Technology Stack

- Framework: Next.js with App Router.
- Language: TypeScript.
- UI: React.
- Styling: Tailwind CSS.
- Primary backend: Fastify through `http1.ts`.
- Microservice backend: FastAPI through `http2.ts`.
- Routing: Next.js filesystem-based routing.
- API communication: Centralized HTTP clients.
- Components: Functional React components.
- Rendering: Server Components by default; Client Components only when necessary.

---

## 3. Mandatory Folder Structure

```text
frontend/
|-- app/
|   |-- layout.tsx
|   |-- page.tsx
|   |-- globals.css
|   |-- favicon.ico
|   |-- components/          # Home-page UI
|   |-- api/                 # Home-page API functions
|   |-- hooks/               # Home-page state and polling
|   |-- dashboard/           # Example future route
|   |   |-- page.tsx
|   |   |-- components/
|   |   `-- api/
|   `-- campaigns/           # Example future route
|       |-- page.tsx
|       |-- components/
|       `-- api/
|-- components/              # Shared UI and layouts
|   |-- ui/
|   `-- layout/
|       `-- Navbar.tsx
|-- lib/
|   |-- http.ts              # Shared transport implementation
|   |-- http1.ts             # Fastify client
|   `-- http2.ts             # FastAPI client
|-- hooks/                   # Shared hooks when needed
|-- types/
|-- config/
|   `-- env.ts
|-- public/
|-- docs/
|   `-- ARCHITECTURE.md
|-- .env.example
|-- AGENTS.md
|-- next.config.ts
|-- package.json
`-- tsconfig.json
```

This is a reference structure, not a requirement to create every file immediately. Create folders and files when the corresponding functionality is needed.

The Next.js application lives directly under `frontend/app/`. Do not introduce a `src/` directory or a second App Router root. Shared folders (`components/`, `lib/`, `types/`, `config/`, and shared `hooks/`) also live directly under `frontend/`. The TypeScript alias `@/*` maps to `./*` in `frontend/tsconfig.json`. Keep `.env.local`, `public/`, and framework configuration at the frontend root.

---

## 4. Route-Based Folder Rules

Every URL page must have a corresponding folder inside `app/`.

Examples:

| URL | Page file |
|---|---|
| `/` | `app/page.tsx` |
| `/dashboard` | `app/dashboard/page.tsx` |
| `/campaigns` | `app/campaigns/page.tsx` |
| `/settings` | `app/settings/page.tsx` |
| `/campaigns/[id]` | `app/campaigns/[id]/page.tsx` |

### Rules

1. Use the URL's route segment as the folder name.
2. Use `page.tsx` exclusively for the route's page entry point.
3. Store page-specific components in that route's `components/` directory.
4. Store page-specific API functions in that route's `api/` directory.
5. Store genuinely reusable components in `components/`.
6. Store shared utilities and HTTP clients in `lib/`.
7. Do not place unrelated features inside another route's folder.
8. Use lowercase kebab-case for URL segments and PascalCase for React component filenames.
9. Dynamic routes must use Next.js conventions, such as `[id]`.
10. Ordinary files inside `app/` do not create URLs by themselves; special Next.js files such as `page.tsx` and `route.ts` do.

---

## 5. Page Component Rules

A page must coordinate its feature, not contain its entire implementation.

### `page.tsx` responsibilities

- Compose page-specific components.
- Read route parameters and search parameters when needed.
- Load initial data using the appropriate rendering strategy.
- Pass data and callbacks to child components.
- Handle page-level composition and layout.

### `page.tsx` must not

- Contain large UI implementations.
- Define multiple reusable components inline.
- Contain raw HTTP request logic.
- Contain extensive business logic.
- Duplicate components already implemented elsewhere.
- Contain hundreds of lines of JSX.

Example:

```tsx
// app/dashboard/page.tsx

import DashboardHeader from "./components/DashboardHeader";
import DashboardStats from "./components/DashboardStats";
import DashboardContent from "./components/DashboardContent";

export default function DashboardPage() {
  return (
    <main className="space-y-6 p-6">
      <DashboardHeader />
      <DashboardStats />
      <DashboardContent />
    </main>
  );
}
```

Keep the page focused on composition. Move complex data loading, interactions, and rendering into appropriately separated modules.

---

## 6. Component Size Limits

Every `.tsx` component must follow these limits.

- Target: 100 lines or fewer.
- Hard guideline: 120 lines maximum.
- A component should have one clear responsibility.
- Extract repeated UI into reusable components.
- Extract complicated calculations into utility functions or feature-specific logic modules.
- Extract complex forms into smaller form sections.
- Extract repeated rendering into dedicated components.
- Avoid splitting code into meaningless components just to meet a line count.

The line count includes imports, types, component logic, JSX, and exports.

If a component exceeds 120 lines, refactor it before adding more functionality. If a framework-required file or a genuinely cohesive component is an exception, document the reason and keep the exception minimal.

The same principle applies to API modules and utility files: keep them focused, and split them when they acquire multiple unrelated responsibilities.

---

## 7. Page-Specific API Architecture

Every feature must own its API request functions in its own `api/` folder.

Example:

```text
app/
├── dashboard/
│   ├── page.tsx
│   ├── components/
│   └── api/
│       └── dashboard.ts
│
└── campaigns/
    ├── page.tsx
    ├── components/
    └── api/
        └── campaigns.ts
```

### Naming conventions

- Dashboard APIs: `dashboard.ts`
- Campaign APIs: `campaigns.ts`
- Settings APIs: `settings.ts`
- User APIs: `users.ts`

The filename should identify the route or feature it serves.

### API module responsibilities

- Export named, typed request functions.
- Call the appropriate centralized HTTP client.
- Define request parameters and response types when appropriate.
- Normalize feature-specific request data when needed.
- Propagate errors to the caller or handle them through an explicitly defined error policy.

### API modules must not

- Create their own independent HTTP client.
- Duplicate base URL configuration.
- Hardcode authentication secrets.
- Contain React components.
- Contain UI-specific state or JSX.
- Duplicate common authentication or transport logic.

Example:

```ts
// app/dashboard/api/dashboard.ts

import { http1 } from "@/lib/http1";

export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
}

export async function getDashboardStats() {
  return http1.get<DashboardStats>("/dashboard/stats");
}
```

The exact endpoint and response shape must match the actual backend contract. Do not invent endpoints when the backend specification is unavailable.

If a feature needs both backends, its API module may import both clients. Keep the two backend responsibilities explicit.

---

## 8. Centralized Backend Communication

The application has two independent backend communication clients.

```text
Feature components and pages
           |
           v
Feature API modules
      /         \
     v           v
 http1.ts      http2.ts
     |           |
     v           v
 Fastify       FastAPI
 backend       microservice
```

### 8.1 `lib/http1.ts`

**Purpose:** Communicate with the primary Fastify backend.

Responsibilities:

- Configure the Fastify base URL.
- Provide shared typed HTTP methods.
- Handle common headers.
- Apply the agreed authentication mechanism.
- Serialize request bodies and parse responses.
- Handle HTTP and network errors consistently.
- Support cancellation and request options where needed.

### 8.2 `lib/http2.ts`

**Purpose:** Communicate with the FastAPI microservice backend.

Responsibilities:

- Configure the FastAPI base URL independently.
- Provide shared typed HTTP methods.
- Apply the appropriate headers and authentication.
- Handle response parsing and errors consistently.
- Support cancellation and request options where needed.

The two clients must not silently route requests through each other.

Do not assume that the backends share authentication, cookies, tokens, error formats, or response structures. Configure these according to their actual contracts.

### HTTP client rules

1. Do not scatter direct `fetch()` calls across components.
2. Do not repeat backend base URLs in feature files.
3. Use environment variables for backend URLs.
4. Do not expose private credentials to browser code.
5. Keep client methods typed and predictable.
6. Preserve useful backend error details without exposing secrets.
7. Use timeouts and cancellation where appropriate.
8. Do not automatically retry non-idempotent requests unless the operation is safe to retry.
9. Avoid logging authorization headers, tokens, or sensitive request data.

### Environment variables

Example `.env.example`:

```env
NEXT_PUBLIC_FASTIFY_API_URL=
NEXT_PUBLIC_FASTAPI_API_URL=
```

These variables are suitable only for public base URLs used by browser requests. Values prefixed with `NEXT_PUBLIC_` are exposed to client-side code.

If a backend must remain private or require server-only credentials, route requests through server-side code and use non-public environment variables. Never put secrets in `NEXT_PUBLIC_` variables.

---

## 9. Server and Client Component Boundaries

Next.js App Router uses React Server Components by default.

### Server Components

Use Server Components for:

- Initial server-side data loading.
- Rendering content that does not require browser APIs.
- Accessing server-only configuration.
- Reducing unnecessary client-side JavaScript.

### Client Components

Use `"use client"` only when a component requires:

- React state or effects.
- Event handlers.
- Browser APIs.
- Client-side interactive forms or widgets.
- Client-side request execution when required.

Do not add `"use client"` to every file.

Do not import server-only modules into Client Components. Client-side components must not access private environment variables or server credentials.

Choose the appropriate HTTP client execution environment deliberately. A browser-facing HTTP client and a server-side HTTP client may need different authentication and URL-resolution strategies.

---

## 10. Tailwind CSS Rules

Tailwind CSS is the default styling system.

### Mandatory rules

- Use Tailwind utility classes for component styling.
- Follow the project's shared design tokens.
- Keep responsive styling within Tailwind's responsive utilities.
- Reuse common UI components instead of duplicating large class lists.
- Keep class names readable.
- Use a shared utility such as `cn()` only if the project has established a consistent class-merging convention.
- Use CSS modules or global CSS only for cases that cannot be reasonably handled through Tailwind.
- Avoid arbitrary values when an established design token already exists.
- Do not add a styling library without approval.

Example:

```tsx
export default function DashboardHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>
    </header>
  );
}
```

All components must follow the project's separate design-system specification for colors, spacing, typography, borders, and interactive states.

---

## 11. Shared and Feature-Specific Components

### Feature-specific components

Store components used only by one route inside that route's `components/` folder.

Example:

`app/campaigns/components/CampaignList.tsx`

### Shared components

Store components reused across multiple unrelated features inside `components/`.

Examples:

- `components/ui/Button.tsx`
- `components/ui/Modal.tsx`
- `components/layout/Navbar.tsx`

### Reuse rules

- Do not duplicate an existing shared component.
- Do not make a component globally shared before it has a genuine reuse requirement.
- Avoid components with unrelated responsibilities.
- Keep components independent of backend transport details.
- Pass data through typed props.
- Keep reusable UI components generic; keep feature-specific business rules inside the feature.

---

## 12. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Route folders | kebab-case | `campaign-settings/` |
| Components | PascalCase | `CampaignHeader.tsx` |
| Page files | Next.js convention | `page.tsx` |
| API modules | Feature name | `campaigns.ts` |
| Hooks | camelCase with `use` | `useDebounce.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types and interfaces | PascalCase | `CampaignResponse` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| HTTP clients | Fixed names | `http1.ts`, `http2.ts` |

Use named exports for API functions and reusable utilities by default. Use default exports where required by Next.js conventions or where the project's established component convention calls for them.

---

## 13. TypeScript Rules

- Keep TypeScript strict mode enabled.
- Avoid `any`; use `unknown` when the type is not known.
- Define request and response types.
- Type component props explicitly when needed.
- Use discriminated unions for complex state and result types.
- Validate untrusted API responses at appropriate boundaries.
- Avoid unnecessary type assertions.
- Share common types only when they are genuinely shared.
- Do not duplicate backend contracts across unrelated files.

Frontend TypeScript types do not replace backend validation.

---

## 14. Error Handling and Loading States

Every data-driven feature must define its loading, success, empty, and error states where applicable.

Use:

- `loading.tsx` for route-level loading UI when appropriate.
- `error.tsx` for route-level error boundaries.
- `not-found.tsx` for missing resources when appropriate.
- Local component state for localized interaction states.
- A consistent API error format for application-level handling.

Do not silently swallow errors.

Do not show raw stack traces or internal server errors to users.

Preserve actionable error information for debugging without leaking sensitive details.

---

## 15. Security Rules

- Never commit secrets or `.env` files.
- Keep private environment variables server-only.
- Validate user input at appropriate boundaries.
- Do not trust client-provided authorization or role information.
- Never treat frontend route protection as a replacement for backend authorization.
- Handle authentication and token expiration according to the actual backend contracts.
- Avoid unsafe HTML rendering.
- Apply CSRF protections where required by the authentication and deployment model.
- Use HTTPS in production.
- Do not expose internal microservice credentials to the browser.

---

## 16. Required Development Workflow

Before implementing a feature, the developer or AI agent must:

1. Identify the route and its requirements.
2. Inspect existing files and reusable components.
3. Identify which backend owns the required operation.
4. Define or confirm the API request and response contracts.
5. Add API functions to the feature's `api/` directory.
6. Implement UI in small, focused components.
7. Apply the established Tailwind design system.
8. Add loading, error, and empty states as needed.
9. Test the feature and verify existing behavior.
10. Update relevant documentation when architecture or API contracts change.

Never recreate an existing feature simply because it is easier than understanding the existing implementation.

---

## 17. AI Coding Agent Rules

Every AI coding agent must follow these rules:

1. Read this document before making architectural changes.
2. Inspect the existing project before creating files.
3. Follow the existing folder structure and naming conventions.
4. Never create a second HTTP client for a backend that already has one.
5. Keep feature API functions in the corresponding route's `api/` folder.
6. Keep components under 100 lines whenever practical and refactor components that exceed 120 lines.
7. Never place the entire feature implementation inside `page.tsx`.
8. Use Tailwind CSS and existing design tokens.
9. Do not introduce new dependencies without approval.
10. Do not invent API endpoints, schemas, authentication rules, or environment variables without verifying the project contract.
11. Do not overwrite existing implementations without inspecting their dependencies.
12. Do not claim that a feature works without performing the available relevant checks.
13. Update this document when an approved architectural change makes it inaccurate.
14. Report any unavoidable deviation and explain why it is necessary.

---

## 18. Definition of Done

A feature is ready for review only when:

- [ ] Its route and folder structure follow this document.
- [ ] Its page component focuses on composition.
- [ ] Its components have clear, limited responsibilities.
- [ ] Its API functions live in the correct feature `api/` directory.
- [ ] All backend requests use the appropriate HTTP client.
- [ ] Its types and error handling are defined.
- [ ] Its styling follows Tailwind and the design system.
- [ ] Its loading, empty, and error states are handled where applicable.
- [ ] No secrets or private credentials are exposed.
- [ ] Relevant tests, linting, and type checks pass.
- [ ] Documentation is updated when required.

---

## 19. Architecture Change Policy

This document is the source of truth for frontend architecture.

Any change to the routing model, folder conventions, HTTP client responsibilities, component size limits, or shared-code organization must be deliberate.

Do not create alternative conventions for individual features without a documented reason.

When the project evolves, update this document first or alongside the implementation so that developers and AI agents continue to follow one consistent architecture.

## Connected workspace implementation

`app/analyze/page.tsx` places async search-parameter access beneath Suspense for Next.js Cache Components, then composes route-local workspace components. Its key resets report state when switching report URLs or starting a new workspace. `app/hooks/useAnalysis.ts` starts/polls jobs and restores a saved report by explicit URL ID. The homepage form navigates to the workspace; it does not run the crawler inline. `app/analyze/api/workspace.ts` owns typed history, activity, and brief requests.

`app/auth/` owns the account page/form and typed auth API. Shared `components/auth/` provides account context and navigation. `lib/http1.ts` bootstraps one guest identity before parallel API calls. Only the Fastify client sends credentials and the custom CSRF header; `http2.ts` remains separate and does not receive these credentials. Tokens never enter browser storage. Account session changes update context and navigate to a fresh workspace.

The workspace uses responsive Tailwind components and two-word navigation labels. User-authored notes are stored separately from observed/inferred AI findings. Analytics derives counts only from returned research; traffic and conversions remain explicitly unavailable. Source links reuse the existing safe URL helpers and evidence detail components. History and activity support opaque server cursors, loading/error/empty states and owner-scoped report links. Full API/storage/retention contracts are documented in the root README.
