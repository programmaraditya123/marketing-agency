## Microservice Deployment

Run locally with `python server.py`. Startup reads `X_ZOHO_CATALYST_LISTEN_PORT`, then `PORT`, then 8000 and binds to `0.0.0.0`. AppSail runs this same entry point with `PYTHONPATH=./packages`; dependencies must be Linux/Python 3.10 compatible. `.catalystignore` excludes environment files and local artifacts. Set GEMINI_API_KEY, GEMINI_MODEL and MICROSERVICE_TOKEN as runtime variables, never tracked app-config values.

Deployment target, current verification and ongoing AI handoff notes live in `../PROJECT_STATUS.md`.



Whenever you make changes to the Microservice, run the following command to deploy the updated Microservice to Zoho Catalyst AppSail:

```bash
catalyst deploy --only appsail
```
or prefer below
```bash
catalyst deploy --only appsail:market-agency
```

**Note:** Make sure you are in the Microservice project directory before running the command.

CORS is always enabled with fixed origins `https://orbit.vidorahub.com` and `http://localhost:3000` in `config/cors.py`. Environment variables cannot replace or disable this allowlist. Credentials are supported; authentication remains required. Catalyst gateway preflights also require the project Authorized Domains configuration.

Private POST /api/v1/competitors/suggestions accepts the saved business context and asks Gemini directly for ten competitors with company names, official website URLs and short descriptions. It uses the existing token/key/model settings and no Google/web-search tools.
