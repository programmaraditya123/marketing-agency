## Microservice Deployment

Run locally with `python server.py`. Startup reads `X_ZOHO_CATALYST_LISTEN_PORT`, then `PORT`, then 8000 and binds to `0.0.0.0`. AppSail runs this same entry point with `PYTHONPATH=./packages`; dependencies must be Linux/Python 3.10 compatible. `.catalystignore` excludes environment files and local artifacts. Set GEMINI_API_KEY, GEMINI_MODEL and MICROSERVICE_TOKEN as runtime variables, never tracked app-config values.

Deployment target, current verification and ongoing AI handoff notes live in `../PROJECT_STATUS.md`.

`config/cors.py` configures explicit-origin CORS from `CORS_ORIGINS`, defaulting to localhost:3000 and https://orbit.vidorahub.com. Analysis still requires the private service token; browser clients must use Backend. Catalyst Authorized Domains must also permit the frontend domain for gateway-level preflight responses.

Set `CORS_MANAGED_BY_CATALYST=true` only when Catalyst is managing CORS response headers. Local/default mode keeps the ASGI middleware. This setting does not bypass service authentication.

Whenever you make changes to the Microservice, run the following command to deploy the updated Microservice to Zoho Catalyst AppSail:

```bash
catalyst deploy --only appsail
```
or prefer below
```bash
catalyst deploy --only appsail:market-agency
```

**Note:** Make sure you are in the Microservice project directory before running the command.
