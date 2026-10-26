# Project memory

Read `PROJECT_STATUS.md` before starting work. It is the maintained project handoff record. Inspect the relevant app's architecture document and any more specific AGENTS.md files before changing code.

Update `PROJECT_STATUS.md` throughout each task: record decisions, changed behavior, checks actually run, deployment targets/results, remaining work and blockers. Distinguish verified results from assumptions. Never record passwords, tokens, connection strings, private environment values or other credentials.

Use `X_ZOHO_CATALYST_LISTEN_PORT`, then `PORT`, then the documented local default when starting either backend service. Bind to `0.0.0.0` on AppSail. Do not hardcode a deployment port.

Preserve unrelated uncommitted work. Deployments require user authorization. The 2026-10-26 request authorizes Backend and Microservice deployment to their existing Catalyst Development targets and explicitly approves their runtime secret configuration. This record does not grant permission for unrelated future deployments or credential transfers.
