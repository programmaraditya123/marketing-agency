# ARCHITECTURE.md — FastAPI AI Microservice

## 1. Purpose

This document defines the mandatory folder structure, responsibilities, development conventions, and production requirements for the Python FastAPI microservice.

The microservice supports conventional REST APIs, AI model integrations, MCP tools, and AI workflows built using LangGraph and LangChain.

All developers and AI coding agents must follow this architecture when creating, modifying, or refactoring code.

### Core principles

- Keep the application entry point minimal.
- Separate routes from business logic.
- Keep service files aligned with their route filenames.
- Maintain dedicated modules for MCP tools.
- Centralize AI provider integrations.
- Separate individual AI model integrations from workflow orchestration.
- Keep shared utilities in the root `utils/` folder.
- Use typed inputs, outputs, and validated configuration.
- Keep files focused, reusable, and testable.
- Never mix HTTP handling, business operations, and AI orchestration unnecessarily.

---

## 2. Technology Stack

- Language: Python.
- Web framework: FastAPI.
- ASGI server: Uvicorn.
- Data validation: Pydantic.
- AI model integrations: OpenAI/ChatGPT-compatible APIs and Google Gemini.
- AI orchestration: LangGraph and LangChain.
- MCP integration: Python MCP SDK or the project's approved MCP framework.
- Configuration: environment variables with validated settings.
- Testing: pytest and FastAPI's test client.
- Logging: Python structured logging or the project's approved logging solution.

Use the project's existing database, Redis client, authentication implementation, and deployment configuration. Do not introduce duplicate infrastructure clients without approval.

---

## 3. Mandatory Root Folder Structure

```text
microservice/
│
├── main.py
│
├── routes/
│   ├── __init__.py
│   ├── useradd.py
│   ├── file.py
│   └── health.py
│
├── service/
│   ├── __init__.py
│   ├── useradd.py
│   ├── file.py
│   └── health.py
│
├── mcp/
│   ├── __init__.py
│   ├── server.py
│   ├── useradd.py
│   └── file.py
│
├── model/
│   ├── __init__.py
│   ├── openai_model.py
│   ├── gemini_model.py
│   └── model_factory.py
│
├── workflows/
│   ├── __init__.py
│   ├── state.py
│   ├── user_workflow.py
│   ├── file_workflow.py
│   └── graph_registry.py
│
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── logging.py
│   ├── security.py
│   ├── database.py
│   ├── redis.py
│   └── lifecycle.py
│
├── schemas/
│   ├── __init__.py
│   ├── useradd.py
│   ├── file.py
│   └── common.py
│
├── utils/
│   ├── __init__.py
│   ├── exceptions.py
│   ├── responses.py
│   ├── validators.py
│   └── constants.py
│
├── prompts/
│   ├── __init__.py
│   └── system_prompts.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── workflows/
│
├── .env.example
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── README.md
└── ARCHITECTURE.md
```

This structure is a reference. Create only the files required by the project. Every Python package directory should contain `__init__.py` when explicit package organization is needed.

The `main.py` filename is used as the entry point in this architecture. If the deployment configuration already expects `main:app`, preserve that import path.

---

## 4. Application Entry Point — `main.py`

`main.py` creates the FastAPI application and connects the application layers.

### Allowed responsibilities

- Create the FastAPI application.
- Configure application metadata.
- Register middleware.
- Register API routers.
- Configure exception handlers.
- Attach the application lifespan.
- Expose the `app` object to the ASGI server.

### Prohibited responsibilities

`main.py` must not contain:

- Business logic.
- User registration or file processing implementations.
- Direct AI model calls.
- LangGraph workflow implementations.
- MCP tool implementations.
- Inline route handlers.
- Database query implementations.
- Large validation functions.
- Hardcoded secrets or provider API keys.

### Example

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI

from config.lifecycle import lifespan
from config.settings import settings
from routes.useradd import router as user_router
from routes.file import router as file_router
from routes.health import router as health_router
from utils.exceptions import register_exception_handlers


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

register_exception_handlers(app)

app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(file_router, prefix="/files", tags=["Files"])
```

Run the application through the deployment's configured ASGI command, for example `uvicorn main:app`.

Do not create a second application instance in another module.

---

## 5. Route Architecture — `routes/`

The `routes/` folder contains FastAPI endpoint definitions only.

Each route file corresponds to a feature and has a matching service file.

Example:

```text
routes/useradd.py
service/useradd.py
```

### Route responsibilities

- Define endpoint paths and HTTP methods.
- Declare request parameters and response models.
- Apply dependency injection for authentication and authorization.
- Validate inputs through Pydantic models and FastAPI dependencies.
- Call the corresponding service functions.
- Return typed responses and appropriate HTTP status codes.

### Route files must not

- Call an AI provider directly.
- Contain database queries.
- Implement long business workflows.
- Perform substantial file processing.
- Define large business rules.
- Duplicate service logic.
- Initialize external connections.

### Example

```python
from fastapi import APIRouter, status

from schemas.useradd import UserCreate, UserResponse
from service.useradd import create_user

router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_user(payload: UserCreate) -> UserResponse:
    return await create_user(payload)
```

Authentication dependencies should be attached to routes or routers according to the security policy. Do not leave sensitive routes unprotected by default.

---

## 6. Service Architecture — `service/`

The `service/` folder contains business logic and application operations.

Each service file must have the same feature name as its corresponding route file.

Examples:

- `routes/useradd.py` → `service/useradd.py`
- `routes/file.py` → `service/file.py`
- `routes/health.py` → `service/health.py`

### Service responsibilities

- Implement business rules.
- Coordinate database and Redis operations.
- Call AI model adapters when AI functionality is required.
- Invoke LangGraph workflows when orchestration is required.
- Perform file processing and transformations.
- Enforce application-level constraints.
- Return typed results or raise defined application exceptions.

### Service files must not

- Define FastAPI endpoints.
- Create another FastAPI application.
- Read raw HTTP request bodies unnecessarily.
- Contain provider API keys.
- Reimplement shared authentication.
- Duplicate global utility functions.
- Initialize new database connections for each operation.

### Example

```python
from schemas.useradd import UserCreate, UserResponse


async def create_user(payload: UserCreate) -> UserResponse:
    # Apply business rules and persist through
    # the project's established data-access layer.
    raise NotImplementedError("Connect the user repository")
```

This example intentionally leaves persistence unimplemented. The real implementation must use the existing database schema and connection.

### Additional service files

When a feature grows, create focused modules such as:

- `service/user_repository.py`
- `service/file_processing.py`
- `service/user_validation.py`

Do this only when the separation provides a clear benefit. Do not force unrelated operations into a single service file just because they belong to the same feature.

---

## 7. MCP Tool Architecture — `mcp/`

The `mcp/` folder contains tools exposed through the Model Context Protocol.

MCP tools provide a controlled interface for AI clients and agents to invoke approved application capabilities.

### Folder responsibilities

- `mcp/server.py`: configure and expose the MCP server.
- `mcp/useradd.py`: define user-related MCP tools.
- `mcp/file.py`: define file-related MCP tools.

Additional feature files follow the same naming convention.

### MCP tool responsibilities

- Define tool names, descriptions, and input schemas.
- Validate incoming tool arguments.
- Call existing service functions for business operations.
- Return structured, safe results.
- Apply appropriate authorization and execution limits.
- Report errors without leaking internal secrets.

### Mandatory rules

1. MCP tools must not duplicate business logic already implemented in `service/`.
2. MCP tools must not bypass application authorization.
3. Do not expose unrestricted database access to an AI agent.
4. Do not allow arbitrary filesystem access or unrestricted command execution.
5. Apply timeouts and limits to expensive operations.
6. Validate all tool arguments.
7. Require explicit authorization for destructive or sensitive actions.
8. Keep tool descriptions accurate and specific.
9. Never expose API keys, passwords, access tokens, or private connection strings in tool responses.
10. Do not execute untrusted tool arguments as Python code.

### MCP and REST share services

```text
REST request                     MCP tool call
     |                                |
     v                                v
routes/useradd.py                mcp/useradd.py
     |                                |
     v                                v
          service/useradd.py
                  |
                  v
          Data / business logic
```

Both entry points should reuse the same service implementation wherever their business operation is equivalent.

Do not expose the MCP server publicly without an explicit transport, authentication, authorization, and deployment design. MCP transport setup belongs in `mcp/server.py` or a dedicated configuration module.

---

## 8. AI Model Integrations — `model/`

The `model/` folder contains integrations with individual AI providers.

Examples:

- `model/openai_model.py`
- `model/gemini_model.py`
- `model/model_factory.py`

### Provider adapter responsibilities

- Initialize the provider client.
- Read provider configuration securely.
- Select configured models.
- Submit model requests.
- Normalize provider responses where useful.
- Apply timeouts and handle provider errors.
- Support structured output when available.
- Track usage and latency without logging sensitive prompts unnecessarily.

### OpenAI integration

`openai_model.py` owns the integration with the approved OpenAI API or compatible provider interface.

### Gemini integration

`gemini_model.py` owns the integration with Google's Gemini API and its provider-specific settings.

### Model factory

`model_factory.py` selects an approved model adapter based on explicit application configuration or a validated task-level selection.

Do not let arbitrary user input select unrestricted model names or provider endpoints.

### Model integration rules

- Never hardcode API keys.
- Never initialize provider clients repeatedly for every request when reuse is supported.
- Keep provider-specific SDK details inside the adapter.
- Apply bounded retries only to appropriate transient failures.
- Use separate timeout and retry policies for different providers.
- Handle rate limits and quota failures explicitly.
- Do not assume all providers support the same features or structured-output formats.
- Do not log secrets or unnecessarily retain sensitive user content.
- Validate model output before passing it to business operations.

Do not confuse the `model/` directory with Pydantic data models. Pydantic request and response schemas belong in `schemas/`.

---

## 9. AI Workflow Architecture — `workflows/`

The `workflows/` folder contains multi-step AI workflows implemented with LangGraph and LangChain.

### Suggested structure

- `workflows/state.py`: shared or workflow-specific typed state definitions.
- `workflows/user_workflow.py`: user-related AI workflows.
- `workflows/file_workflow.py`: file analysis and processing workflows.
- `workflows/graph_registry.py`: centralized access to approved workflow graphs.

Add workflow-specific files when a workflow becomes complex enough to justify them.

### LangGraph responsibilities

Use LangGraph for workflows that need:

- Multiple processing stages.
- Conditional branching.
- Explicit state transitions.
- Retry or recovery paths.
- Human approval steps.
- Checkpointing or resumable execution.
- Coordinated tool calling.

### LangChain responsibilities

Use LangChain components where they provide value for:

- Model integrations and runnable composition.
- Prompt templates.
- Output parsing.
- Retrieval and document-processing chains.
- Tool integration.

Do not introduce LangChain abstractions into every simple model call unnecessarily.

### Workflow rules

1. Keep graph construction outside route handlers.
2. Use typed state definitions.
3. Separate individual nodes from graph orchestration when appropriate.
4. Reuse provider adapters or shared model configuration.
5. Validate inputs and outputs at workflow boundaries.
6. Set execution limits and timeouts.
7. Handle partial failures and provider rate limits.
8. Keep prompts separate from workflow code when they are substantial or reused.
9. Avoid storing secrets or unnecessary sensitive user data in workflow checkpoints.
10. Use durable checkpointing only when the workflow needs persistence or resumability.
11. Keep side effects idempotent where possible.
12. Require explicit approval before high-impact or destructive actions.

### Workflow execution flow

```text
FastAPI route or MCP tool
          |
          v
     Service layer
          |
          v
   Workflow registry
          |
          v
      LangGraph
          |
          v
  Workflow nodes / tools
          |
          v
    Model adapters
          |
          v
 Validated workflow result
```

A workflow may call deterministic services, model adapters, or approved tools. Do not allow an LLM to bypass authorization or directly perform unrestricted side effects.

---

## 10. Configuration — `config/`

The `config/` folder contains shared application configuration and infrastructure lifecycle logic.

### `config/settings.py`

- Load and validate environment variables.
- Define required configuration.
- Provide safe defaults only where appropriate.
- Fail startup when mandatory settings are invalid.
- Keep secret values out of source control.

### `config/database.py`

- Initialize the project's database client.
- Reuse the configured connection or pool.
- Expose the approved database access interface.
- Provide a clean shutdown function.

### `config/redis.py`

- Initialize the shared Redis client.
- Configure connection and timeout settings.
- Handle connection failures appropriately.
- Provide a clean shutdown function.

### `config/security.py`

- Define shared security configuration.
- Centralize applicable authentication and authorization settings.
- Avoid duplicating JWT or cookie validation across routes and services.

### `config/logging.py`

- Configure consistent application logging.
- Redact sensitive data.
- Provide structured logs where supported.

### `config/lifecycle.py`

- Initialize required infrastructure during FastAPI lifespan startup.
- Release resources during shutdown.
- Avoid opening duplicate connections.
- Define what happens when a required dependency is unavailable.

The exact database, Redis, and authentication implementations must match the existing application. Do not introduce new connection systems without approval.

---

## 11. Pydantic Schemas — `schemas/`

The `schemas/` folder defines validated data contracts.

Examples:

- `schemas/useradd.py`
- `schemas/file.py`
- `schemas/common.py`

### Rules

- Use Pydantic models for request and response validation.
- Keep external input validation at API boundaries.
- Define output models explicitly for public endpoints.
- Avoid returning raw database objects without controlled serialization.
- Do not use request schemas as unrestricted database update objects.
- Separate internal data structures from public API responses where needed.
- Reuse shared schemas only when their contracts genuinely match.

Type annotations alone do not validate untrusted external data.

---

## 12. Global Utilities — `utils/`

The root `utils/` folder contains reusable, cross-feature functions.

### Examples

- `exceptions.py`: application exception types and exception-handler registration.
- `responses.py`: common response helpers, if a consistent response envelope is required.
- `validators.py`: generic validation helpers not specific to one feature.
- `constants.py`: global constants shared across modules.

### Utility rules

- Keep utilities independent of feature-specific business rules.
- Prefer pure functions.
- Avoid hidden database or network operations inside general utilities.
- Do not create duplicate helpers with slightly different behavior.
- Use explicit types and predictable return values.
- Do not put model-provider logic or workflow orchestration in `utils/`.

A helper used exclusively by one feature belongs in that feature's service or a feature-specific module instead.

---

## 13. Prompt Management — `prompts/`

Use `prompts/` for substantial, reusable system prompts, instruction templates, and prompt-building functions.

### Rules

- Give prompts clear, descriptive names.
- Version important prompts when prompt changes affect output contracts.
- Keep sensitive values out of prompt files.
- Separate reusable prompt templates from business logic.
- Validate structured model output rather than trusting generated text.
- Treat retrieved documents, website content, and user-provided text as untrusted input.
- Do not treat instructions embedded in untrusted content as trusted system instructions.

Short prompts used once may remain near their workflow if that keeps the implementation clearer.

---

## 14. Security Requirements

All external inputs, model outputs, uploaded files, and MCP arguments must be treated as untrusted.

### Mandatory controls

- Validate all incoming data.
- Authenticate and authorize protected operations.
- Keep API keys in secure environment configuration or a secret manager.
- Never return secrets in API or MCP responses.
- Enforce upload size and file-type limits.
- Prevent path traversal and unsafe file access.
- Apply request rate limits where appropriate.
- Set timeouts for model and external-service calls.
- Avoid unrestricted tool execution.
- Prevent unauthorized cross-user resource access.
- Redact credentials and sensitive information from logs.
- Apply CSRF controls where cookie-based browser authentication requires them.
- Protect against prompt injection when AI workflows process external content.
- Restrict AI tools to explicitly approved capabilities.

Authentication for REST endpoints and MCP connections must be configured explicitly; one does not automatically secure the other.

---

## 15. Error Handling and Observability

Use a consistent exception-handling strategy throughout the microservice.

### Expected errors

Examples:

- Invalid input.
- Unauthenticated request.
- Forbidden operation.
- Resource not found.
- External provider rate limit.
- Model timeout.
- Invalid model output.
- Temporary infrastructure unavailability.

Map these errors to appropriate HTTP status codes and safe error responses.

### Logging rules

- Use structured logging.
- Include request or correlation IDs when available.
- Record latency and operational failures.
- Avoid logging secrets or unnecessarily storing sensitive prompt content.
- Distinguish expected failures from unexpected application errors.
- Never expose Python stack traces or internal connection details in production responses.

For AI workflows, capture useful operational metadata such as workflow name, execution status, duration, and provider error category without indiscriminately logging complete user inputs or outputs.

---

## 16. File Size and Naming Conventions

### File size policy

- Target: 100 lines or fewer per Python source file.
- Hard guideline: 120 lines maximum.
- Refactor files that exceed 120 lines before adding more functionality.
- Document necessary exceptions for cohesive implementations that cannot reasonably be split.

The line count includes imports, type definitions, comments, implementation, and exports.

Do not create meaningless modules merely to satisfy the line limit. Each file must have a clear responsibility.

### Naming conventions

| Item | Convention | Example |
|---|---|---|
| Route files | snake_case | `useradd.py` |
| Service files | Match route filename | `useradd.py` |
| MCP tools | Match feature name | `useradd.py` |
| Model adapters | Provider-based | `gemini_model.py` |
| Workflow files | Feature-based | `file_workflow.py` |
| Schemas | Feature-based | `useradd.py` |
| Utility modules | Descriptive snake_case | `validators.py` |
| Functions | snake_case | `create_user` |
| Classes | PascalCase | `UserCreate` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

Avoid ambiguous names such as `helper.py`, `common2.py`, or `misc.py` when a more descriptive name is available.

---

## 17. Testing Requirements

Use pytest and the existing testing conventions.

### Unit tests

Test:

- Service business rules.
- Input validation.
- Utility functions.
- Model output parsing.
- Individual workflow nodes.

### Integration tests

Test:

- FastAPI routes and response schemas.
- Authentication and authorization.
- Database and Redis interactions.
- File handling.
- Model adapter error handling.
- MCP tool invocation and authorization.

### Workflow tests

Test:

- Successful workflow execution.
- Conditional transitions.
- Invalid model output.
- Timeouts and provider failures.
- Retry limits.
- Checkpoint and resume behavior when implemented.
- Human approval requirements for sensitive actions.

Use mocks or isolated test environments for external providers. Never use production credentials or production data for destructive tests.

---

## 18. AI Coding Agent Rules

Every AI coding agent must follow these rules:

1. Read `ARCHITECTURE.md` before making structural changes.
2. Inspect existing files before creating new ones.
3. Keep `main.py` focused on application composition.
4. Create matching route and service filenames for each feature.
5. Keep business logic in the service layer.
6. Keep MCP tool definitions separate from business operations.
7. Reuse model adapters rather than initializing provider clients throughout the application.
8. Keep LangGraph workflow orchestration in `workflows/`.
9. Use Pydantic schemas for external data contracts.
10. Keep shared utilities inside the root `utils/` folder.
11. Reuse configured database and Redis connections.
12. Never invent provider configuration, schemas, endpoints, or database behavior without verifying the project.
13. Do not introduce dependencies without approval.
14. Keep files within the established size guideline.
15. Add or update tests when behavior changes.
16. Run the available tests, linting, and type checks before reporting completion.
17. Update the architecture document when an approved change makes it inaccurate.
18. Explain unavoidable deviations rather than silently creating a second convention.

---

## 19. Definition of Done

A feature is ready for review only when:

- [ ] Routes and services follow the feature naming convention.
- [ ] Route handlers contain no substantial business logic.
- [ ] Inputs and outputs use validated schemas.
- [ ] AI provider calls use the model integration layer.
- [ ] Multi-step AI orchestration uses the workflow layer when appropriate.
- [ ] MCP tools call approved services and enforce authorization.
- [ ] Shared infrastructure uses centralized connections.
- [ ] Errors and logs follow the common policy.
- [ ] Secrets are not exposed.
- [ ] Files follow the size guideline or have a justified exception.
- [ ] Relevant tests pass.
- [ ] Documentation is updated when required.

---

## 20. Architecture Change Policy

This document is the source of truth for the FastAPI microservice.

Every new feature must follow the same folder conventions, data contracts, and separation of responsibilities.

Changes to the route/service relationship, model adapters, MCP exposure, workflow execution, authentication, or infrastructure lifecycle must be deliberate and documented.

The objective is a secure, maintainable, testable, and extensible Python microservice that can support traditional APIs and increasingly sophisticated AI workflows without architectural inconsistency.

`config/cors.py` centralizes explicit-origin CORSMiddleware registration using a fixed CORS_ORIGINS tuple containing https://orbit.vidorahub.com and http://localhost:3000. Environment variables cannot change or disable this allowlist. Main remains application composition only. CORS does not bypass service-token authentication. Catalyst also requires a platform Authorized Domains entry for gateway-handled OPTIONS; app middleware cannot add headers to a response that never reaches ASGI.

## Gemini website analysis

The provider adapter uses a simplified generation schema from `model/gemini_schema.py`. Provider-only simplification removes URI format matchers and nested array/string length bounds that exceed Gemini's constrained-decoder state limit. Field names, required fields, object structure and enums are retained. The full `schemas/analysis.py` contract validates every returned report afterward; evidence validation remains in the service layer.

Gemini 3 uses `responseFormat` with low thinking; Gemini 2 uses `responseMimeType` / `responseJsonSchema` and a bounded thinking budget. Provider HTTP errors, blocked responses, truncation and timeouts have stable safe error codes. Fastify maps these codes to user-facing messages without forwarding arbitrary provider error content or secrets.

## Website analysis implementation

`routes/analyses.py` calls `service/analyses.py`; `model/gemini_model.py` owns the Gemini REST integration. Typed contracts live in `schemas/analysis_input.py` and `schemas/analysis.py`, with the untrusted-content policy in `prompts/website_analysis.py`. Service validation rejects invented citation URLs and unsupported observed findings. One model call does not require a LangGraph workflow.

`config/lifecycle.py` validates credentials and creates a shared async HTTP client. Analysis is a backend-to-backend endpoint protected by `X-Service-Token`; it is not called directly from the browser. MongoDB belongs to Fastify; do not add a second database client here. See the root README for API, configuration and verification instructions.
# ARCHITECTURE.md — FastAPI AI Microservice

## 1. Purpose

This document defines the mandatory folder structure, responsibilities, development conventions, and production requirements for the Python FastAPI microservice.

The microservice supports conventional REST APIs, AI model integrations, MCP tools, and AI workflows built using LangGraph and LangChain.

All developers and AI coding agents must follow this architecture when creating, modifying, or refactoring code.

### Core principles

- Keep the application entry point minimal.
- Separate routes from business logic.
- Keep service files aligned with their route filenames.
- Maintain dedicated modules for MCP tools.
- Centralize AI provider integrations.
- Separate individual AI model integrations from workflow orchestration.
- Keep shared utilities in the root `utils/` folder.
- Use typed inputs, outputs, and validated configuration.
- Keep files focused, reusable, and testable.
- Never mix HTTP handling, business operations, and AI orchestration unnecessarily.

---

## 2. Technology Stack

- Language: Python.
- Web framework: FastAPI.
- ASGI server: Uvicorn.
- Data validation: Pydantic.
- AI model integrations: OpenAI/ChatGPT-compatible APIs and Google Gemini.
- AI orchestration: LangGraph and LangChain.
- MCP integration: Python MCP SDK or the project's approved MCP framework.
- Configuration: environment variables with validated settings.
- Testing: pytest and FastAPI's test client.
- Logging: Python structured logging or the project's approved logging solution.

Use the project's existing database, Redis client, authentication implementation, and deployment configuration. Do not introduce duplicate infrastructure clients without approval.

---

## 3. Mandatory Root Folder Structure

```text
microservice/
│
├── main.py
│
├── routes/
│   ├── __init__.py
│   ├── useradd.py
│   ├── file.py
│   └── health.py
│
├── service/
│   ├── __init__.py
│   ├── useradd.py
│   ├── file.py
│   └── health.py
│
├── mcp/
│   ├── __init__.py
│   ├── server.py
│   ├── useradd.py
│   └── file.py
│
├── model/
│   ├── __init__.py
│   ├── openai_model.py
│   ├── gemini_model.py
│   └── model_factory.py
│
├── workflows/
│   ├── __init__.py
│   ├── state.py
│   ├── user_workflow.py
│   ├── file_workflow.py
│   └── graph_registry.py
│
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── logging.py
│   ├── security.py
│   ├── database.py
│   ├── redis.py
│   └── lifecycle.py
│
├── schemas/
│   ├── __init__.py
│   ├── useradd.py
│   ├── file.py
│   └── common.py
│
├── utils/
│   ├── __init__.py
│   ├── exceptions.py
│   ├── responses.py
│   ├── validators.py
│   └── constants.py
│
├── prompts/
│   ├── __init__.py
│   └── system_prompts.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── workflows/
│
├── .env.example
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── README.md
└── ARCHITECTURE.md
```

This structure is a reference. Create only the files required by the project. Every Python package directory should contain `__init__.py` when explicit package organization is needed.

The `main.py` filename is used as the entry point in this architecture. If the deployment configuration already expects `main:app`, preserve that import path.

---

## 4. Application Entry Point — `main.py`

`main.py` creates the FastAPI application and connects the application layers.

### Allowed responsibilities

- Create the FastAPI application.
- Configure application metadata.
- Register middleware.
- Register API routers.
- Configure exception handlers.
- Attach the application lifespan.
- Expose the `app` object to the ASGI server.

### Prohibited responsibilities

`main.py` must not contain:

- Business logic.
- User registration or file processing implementations.
- Direct AI model calls.
- LangGraph workflow implementations.
- MCP tool implementations.
- Inline route handlers.
- Database query implementations.
- Large validation functions.
- Hardcoded secrets or provider API keys.

### Example

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI

from config.lifecycle import lifespan
from config.settings import settings
from routes.useradd import router as user_router
from routes.file import router as file_router
from routes.health import router as health_router
from utils.exceptions import register_exception_handlers


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

register_exception_handlers(app)

app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(file_router, prefix="/files", tags=["Files"])
```

Run the application through the deployment's configured ASGI command, for example `uvicorn main:app`.

Do not create a second application instance in another module.

---

## 5. Route Architecture — `routes/`

The `routes/` folder contains FastAPI endpoint definitions only.

Each route file corresponds to a feature and has a matching service file.

Example:

```text
routes/useradd.py
service/useradd.py
```

### Route responsibilities

- Define endpoint paths and HTTP methods.
- Declare request parameters and response models.
- Apply dependency injection for authentication and authorization.
- Validate inputs through Pydantic models and FastAPI dependencies.
- Call the corresponding service functions.
- Return typed responses and appropriate HTTP status codes.

### Route files must not

- Call an AI provider directly.
- Contain database queries.
- Implement long business workflows.
- Perform substantial file processing.
- Define large business rules.
- Duplicate service logic.
- Initialize external connections.

### Example

```python
from fastapi import APIRouter, status

from schemas.useradd import UserCreate, UserResponse
from service.useradd import create_user

router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_user(payload: UserCreate) -> UserResponse:
    return await create_user(payload)
```

Authentication dependencies should be attached to routes or routers according to the security policy. Do not leave sensitive routes unprotected by default.

---

## 6. Service Architecture — `service/`

The `service/` folder contains business logic and application operations.

Each service file must have the same feature name as its corresponding route file.

Examples:

- `routes/useradd.py` → `service/useradd.py`
- `routes/file.py` → `service/file.py`
- `routes/health.py` → `service/health.py`

### Service responsibilities

- Implement business rules.
- Coordinate database and Redis operations.
- Call AI model adapters when AI functionality is required.
- Invoke LangGraph workflows when orchestration is required.
- Perform file processing and transformations.
- Enforce application-level constraints.
- Return typed results or raise defined application exceptions.

### Service files must not

- Define FastAPI endpoints.
- Create another FastAPI application.
- Read raw HTTP request bodies unnecessarily.
- Contain provider API keys.
- Reimplement shared authentication.
- Duplicate global utility functions.
- Initialize new database connections for each operation.

### Example

```python
from schemas.useradd import UserCreate, UserResponse


async def create_user(payload: UserCreate) -> UserResponse:
    # Apply business rules and persist through
    # the project's established data-access layer.
    raise NotImplementedError("Connect the user repository")
```

This example intentionally leaves persistence unimplemented. The real implementation must use the existing database schema and connection.

### Additional service files

When a feature grows, create focused modules such as:

- `service/user_repository.py`
- `service/file_processing.py`
- `service/user_validation.py`

Do this only when the separation provides a clear benefit. Do not force unrelated operations into a single service file just because they belong to the same feature.

---

## 7. MCP Tool Architecture — `mcp/`

The `mcp/` folder contains tools exposed through the Model Context Protocol.

MCP tools provide a controlled interface for AI clients and agents to invoke approved application capabilities.

### Folder responsibilities

- `mcp/server.py`: configure and expose the MCP server.
- `mcp/useradd.py`: define user-related MCP tools.
- `mcp/file.py`: define file-related MCP tools.

Additional feature files follow the same naming convention.

### MCP tool responsibilities

- Define tool names, descriptions, and input schemas.
- Validate incoming tool arguments.
- Call existing service functions for business operations.
- Return structured, safe results.
- Apply appropriate authorization and execution limits.
- Report errors without leaking internal secrets.

### Mandatory rules

1. MCP tools must not duplicate business logic already implemented in `service/`.
2. MCP tools must not bypass application authorization.
3. Do not expose unrestricted database access to an AI agent.
4. Do not allow arbitrary filesystem access or unrestricted command execution.
5. Apply timeouts and limits to expensive operations.
6. Validate all tool arguments.
7. Require explicit authorization for destructive or sensitive actions.
8. Keep tool descriptions accurate and specific.
9. Never expose API keys, passwords, access tokens, or private connection strings in tool responses.
10. Do not execute untrusted tool arguments as Python code.

### MCP and REST share services

```text
REST request                     MCP tool call
     |                                |
     v                                v
routes/useradd.py                mcp/useradd.py
     |                                |
     v                                v
          service/useradd.py
                  |
                  v
          Data / business logic
```

Both entry points should reuse the same service implementation wherever their business operation is equivalent.

Do not expose the MCP server publicly without an explicit transport, authentication, authorization, and deployment design. MCP transport setup belongs in `mcp/server.py` or a dedicated configuration module.

---

## 8. AI Model Integrations — `model/`

The `model/` folder contains integrations with individual AI providers.

Examples:

- `model/openai_model.py`
- `model/gemini_model.py`
- `model/model_factory.py`

### Provider adapter responsibilities

- Initialize the provider client.
- Read provider configuration securely.
- Select configured models.
- Submit model requests.
- Normalize provider responses where useful.
- Apply timeouts and handle provider errors.
- Support structured output when available.
- Track usage and latency without logging sensitive prompts unnecessarily.

### OpenAI integration

`openai_model.py` owns the integration with the approved OpenAI API or compatible provider interface.

### Gemini integration

`gemini_model.py` owns the integration with Google's Gemini API and its provider-specific settings.

### Model factory

`model_factory.py` selects an approved model adapter based on explicit application configuration or a validated task-level selection.

Do not let arbitrary user input select unrestricted model names or provider endpoints.

### Model integration rules

- Never hardcode API keys.
- Never initialize provider clients repeatedly for every request when reuse is supported.
- Keep provider-specific SDK details inside the adapter.
- Apply bounded retries only to appropriate transient failures.
- Use separate timeout and retry policies for different providers.
- Handle rate limits and quota failures explicitly.
- Do not assume all providers support the same features or structured-output formats.
- Do not log secrets or unnecessarily retain sensitive user content.
- Validate model output before passing it to business operations.

Do not confuse the `model/` directory with Pydantic data models. Pydantic request and response schemas belong in `schemas/`.

---

## 9. AI Workflow Architecture — `workflows/`

The `workflows/` folder contains multi-step AI workflows implemented with LangGraph and LangChain.

### Suggested structure

- `workflows/state.py`: shared or workflow-specific typed state definitions.
- `workflows/user_workflow.py`: user-related AI workflows.
- `workflows/file_workflow.py`: file analysis and processing workflows.
- `workflows/graph_registry.py`: centralized access to approved workflow graphs.

Add workflow-specific files when a workflow becomes complex enough to justify them.

### LangGraph responsibilities

Use LangGraph for workflows that need:

- Multiple processing stages.
- Conditional branching.
- Explicit state transitions.
- Retry or recovery paths.
- Human approval steps.
- Checkpointing or resumable execution.
- Coordinated tool calling.

### LangChain responsibilities

Use LangChain components where they provide value for:

- Model integrations and runnable composition.
- Prompt templates.
- Output parsing.
- Retrieval and document-processing chains.
- Tool integration.

Do not introduce LangChain abstractions into every simple model call unnecessarily.

### Workflow rules

1. Keep graph construction outside route handlers.
2. Use typed state definitions.
3. Separate individual nodes from graph orchestration when appropriate.
4. Reuse provider adapters or shared model configuration.
5. Validate inputs and outputs at workflow boundaries.
6. Set execution limits and timeouts.
7. Handle partial failures and provider rate limits.
8. Keep prompts separate from workflow code when they are substantial or reused.
9. Avoid storing secrets or unnecessary sensitive user data in workflow checkpoints.
10. Use durable checkpointing only when the workflow needs persistence or resumability.
11. Keep side effects idempotent where possible.
12. Require explicit approval before high-impact or destructive actions.

### Workflow execution flow

```text
FastAPI route or MCP tool
          |
          v
     Service layer
          |
          v
   Workflow registry
          |
          v
      LangGraph
          |
          v
  Workflow nodes / tools
          |
          v
    Model adapters
          |
          v
 Validated workflow result
```

A workflow may call deterministic services, model adapters, or approved tools. Do not allow an LLM to bypass authorization or directly perform unrestricted side effects.

---

## 10. Configuration — `config/`

The `config/` folder contains shared application configuration and infrastructure lifecycle logic.

### `config/settings.py`

- Load and validate environment variables.
- Define required configuration.
- Provide safe defaults only where appropriate.
- Fail startup when mandatory settings are invalid.
- Keep secret values out of source control.

### `config/database.py`

- Initialize the project's database client.
- Reuse the configured connection or pool.
- Expose the approved database access interface.
- Provide a clean shutdown function.

### `config/redis.py`

- Initialize the shared Redis client.
- Configure connection and timeout settings.
- Handle connection failures appropriately.
- Provide a clean shutdown function.

### `config/security.py`

- Define shared security configuration.
- Centralize applicable authentication and authorization settings.
- Avoid duplicating JWT or cookie validation across routes and services.

### `config/logging.py`

- Configure consistent application logging.
- Redact sensitive data.
- Provide structured logs where supported.

### `config/lifecycle.py`

- Initialize required infrastructure during FastAPI lifespan startup.
- Release resources during shutdown.
- Avoid opening duplicate connections.
- Define what happens when a required dependency is unavailable.

The exact database, Redis, and authentication implementations must match the existing application. Do not introduce new connection systems without approval.

---

## 11. Pydantic Schemas — `schemas/`

The `schemas/` folder defines validated data contracts.

Examples:

- `schemas/useradd.py`
- `schemas/file.py`
- `schemas/common.py`

### Rules

- Use Pydantic models for request and response validation.
- Keep external input validation at API boundaries.
- Define output models explicitly for public endpoints.
- Avoid returning raw database objects without controlled serialization.
- Do not use request schemas as unrestricted database update objects.
- Separate internal data structures from public API responses where needed.
- Reuse shared schemas only when their contracts genuinely match.

Type annotations alone do not validate untrusted external data.

---

## 12. Global Utilities — `utils/`

The root `utils/` folder contains reusable, cross-feature functions.

### Examples

- `exceptions.py`: application exception types and exception-handler registration.
- `responses.py`: common response helpers, if a consistent response envelope is required.
- `validators.py`: generic validation helpers not specific to one feature.
- `constants.py`: global constants shared across modules.

### Utility rules

- Keep utilities independent of feature-specific business rules.
- Prefer pure functions.
- Avoid hidden database or network operations inside general utilities.
- Do not create duplicate helpers with slightly different behavior.
- Use explicit types and predictable return values.
- Do not put model-provider logic or workflow orchestration in `utils/`.

A helper used exclusively by one feature belongs in that feature's service or a feature-specific module instead.

---

## 13. Prompt Management — `prompts/`

Use `prompts/` for substantial, reusable system prompts, instruction templates, and prompt-building functions.

### Rules

- Give prompts clear, descriptive names.
- Version important prompts when prompt changes affect output contracts.
- Keep sensitive values out of prompt files.
- Separate reusable prompt templates from business logic.
- Validate structured model output rather than trusting generated text.
- Treat retrieved documents, website content, and user-provided text as untrusted input.
- Do not treat instructions embedded in untrusted content as trusted system instructions.

Short prompts used once may remain near their workflow if that keeps the implementation clearer.

---

## 14. Security Requirements

All external inputs, model outputs, uploaded files, and MCP arguments must be treated as untrusted.

### Mandatory controls

- Validate all incoming data.
- Authenticate and authorize protected operations.
- Keep API keys in secure environment configuration or a secret manager.
- Never return secrets in API or MCP responses.
- Enforce upload size and file-type limits.
- Prevent path traversal and unsafe file access.
- Apply request rate limits where appropriate.
- Set timeouts for model and external-service calls.
- Avoid unrestricted tool execution.
- Prevent unauthorized cross-user resource access.
- Redact credentials and sensitive information from logs.
- Apply CSRF controls where cookie-based browser authentication requires them.
- Protect against prompt injection when AI workflows process external content.
- Restrict AI tools to explicitly approved capabilities.

Authentication for REST endpoints and MCP connections must be configured explicitly; one does not automatically secure the other.

---

## 15. Error Handling and Observability

Use a consistent exception-handling strategy throughout the microservice.

### Expected errors

Examples:

- Invalid input.
- Unauthenticated request.
- Forbidden operation.
- Resource not found.
- External provider rate limit.
- Model timeout.
- Invalid model output.
- Temporary infrastructure unavailability.

Map these errors to appropriate HTTP status codes and safe error responses.

### Logging rules

- Use structured logging.
- Include request or correlation IDs when available.
- Record latency and operational failures.
- Avoid logging secrets or unnecessarily storing sensitive prompt content.
- Distinguish expected failures from unexpected application errors.
- Never expose Python stack traces or internal connection details in production responses.

For AI workflows, capture useful operational metadata such as workflow name, execution status, duration, and provider error category without indiscriminately logging complete user inputs or outputs.

---

## 16. File Size and Naming Conventions

### File size policy

- Target: 100 lines or fewer per Python source file.
- Hard guideline: 120 lines maximum.
- Refactor files that exceed 120 lines before adding more functionality.
- Document necessary exceptions for cohesive implementations that cannot reasonably be split.

The line count includes imports, type definitions, comments, implementation, and exports.

Do not create meaningless modules merely to satisfy the line limit. Each file must have a clear responsibility.

### Naming conventions

| Item | Convention | Example |
|---|---|---|
| Route files | snake_case | `useradd.py` |
| Service files | Match route filename | `useradd.py` |
| MCP tools | Match feature name | `useradd.py` |
| Model adapters | Provider-based | `gemini_model.py` |
| Workflow files | Feature-based | `file_workflow.py` |
| Schemas | Feature-based | `useradd.py` |
| Utility modules | Descriptive snake_case | `validators.py` |
| Functions | snake_case | `create_user` |
| Classes | PascalCase | `UserCreate` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

Avoid ambiguous names such as `helper.py`, `common2.py`, or `misc.py` when a more descriptive name is available.

---

## 17. Testing Requirements

Use pytest and the existing testing conventions.

### Unit tests

Test:

- Service business rules.
- Input validation.
- Utility functions.
- Model output parsing.
- Individual workflow nodes.

### Integration tests

Test:

- FastAPI routes and response schemas.
- Authentication and authorization.
- Database and Redis interactions.
- File handling.
- Model adapter error handling.
- MCP tool invocation and authorization.

### Workflow tests

Test:

- Successful workflow execution.
- Conditional transitions.
- Invalid model output.
- Timeouts and provider failures.
- Retry limits.
- Checkpoint and resume behavior when implemented.
- Human approval requirements for sensitive actions.

Use mocks or isolated test environments for external providers. Never use production credentials or production data for destructive tests.

---

## 18. AI Coding Agent Rules

Every AI coding agent must follow these rules:

1. Read `ARCHITECTURE.md` before making structural changes.
2. Inspect existing files before creating new ones.
3. Keep `main.py` focused on application composition.
4. Create matching route and service filenames for each feature.
5. Keep business logic in the service layer.
6. Keep MCP tool definitions separate from business operations.
7. Reuse model adapters rather than initializing provider clients throughout the application.
8. Keep LangGraph workflow orchestration in `workflows/`.
9. Use Pydantic schemas for external data contracts.
10. Keep shared utilities inside the root `utils/` folder.
11. Reuse configured database and Redis connections.
12. Never invent provider configuration, schemas, endpoints, or database behavior without verifying the project.
13. Do not introduce dependencies without approval.
14. Keep files within the established size guideline.
15. Add or update tests when behavior changes.
16. Run the available tests, linting, and type checks before reporting completion.
17. Update the architecture document when an approved change makes it inaccurate.
18. Explain unavoidable deviations rather than silently creating a second convention.

---

## 19. Definition of Done

A feature is ready for review only when:

- [ ] Routes and services follow the feature naming convention.
- [ ] Route handlers contain no substantial business logic.
- [ ] Inputs and outputs use validated schemas.
- [ ] AI provider calls use the model integration layer.
- [ ] Multi-step AI orchestration uses the workflow layer when appropriate.
- [ ] MCP tools call approved services and enforce authorization.
- [ ] Shared infrastructure uses centralized connections.
- [ ] Errors and logs follow the common policy.
- [ ] Secrets are not exposed.
- [ ] Files follow the size guideline or have a justified exception.
- [ ] Relevant tests pass.
- [ ] Documentation is updated when required.

---

## 20. Architecture Change Policy

This document is the source of truth for the FastAPI microservice.

Every new feature must follow the same folder conventions, data contracts, and separation of responsibilities.

Changes to the route/service relationship, model adapters, MCP exposure, workflow execution, authentication, or infrastructure lifecycle must be deliberate and documented.

The objective is a secure, maintainable, testable, and extensible Python microservice that can support traditional APIs and increasingly sophisticated AI workflows without architectural inconsistency.
