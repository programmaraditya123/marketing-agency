## Backend Deployment

Startup reads `X_ZOHO_CATALYST_LISTEN_PORT`, then `PORT`, then 9000. AppSail uses the compiled `dist/server.js` via `npm start` and binds to `0.0.0.0`. `app-config.json` uses Catalyst's `build_path` key. `.catalystignore` excludes local environment files and development artifacts. Configure credentials and the deployed MICROSERVICE_URL as runtime environment variables; do not add secrets to tracked JSON.

Deployment targets, verification and ongoing AI handoff notes live in `../PROJECT_STATUS.md`.

`CORS_ORIGINS` includes `http://localhost:3000,https://orbit.vidorahub.com`. The normalized list controls credentialed CORS and CSRF Origin checks. On Catalyst, also add the frontend domain to Authentication → Whitelisting → Authorized Domains with CORS enabled: the platform handles preflight requests before Fastify. `node ../scripts/configure-appsail.cjs --cors-only` updates the existing services' runtime origin lists while preserving other settings.

`CORS_MANAGED_BY_CATALYST=true` delegates CORS header generation to the platform to avoid duplicate headers when Authorized Domains is configured. Keep false/unset for local framework-managed CORS. This flag never disables JWT verification or the custom-header/Origin checks on writes. Verify real OPTIONS responses before enabling platform ownership; the flag cannot repair a missing platform preflight header by itself.

Whenever you make changes to the backend, run the following command to deploy the updated backend to Zoho Catalyst AppSail:

```bash
catalyst deploy --only appsail
```

**Note:** Make sure you are in the backend project directory before running the command.
