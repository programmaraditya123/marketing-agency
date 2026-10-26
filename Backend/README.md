## Backend Deployment

Startup reads `X_ZOHO_CATALYST_LISTEN_PORT`, then `PORT`, then 9000. AppSail uses the compiled `dist/server.js` via `npm start` and binds to `0.0.0.0`. `app-config.json` uses Catalyst's `build_path` key. `.catalystignore` excludes local environment files and development artifacts. Configure credentials and the deployed MICROSERVICE_URL as runtime environment variables; do not add secrets to tracked JSON.

Deployment targets, verification and ongoing AI handoff notes live in `../PROJECT_STATUS.md`.



Whenever you make changes to the backend, run the following command to deploy the updated backend to Zoho Catalyst AppSail:

```bash
catalyst deploy --only appsail
```

**Note:** Make sure you are in the backend project directory before running the command.

CORS is always enabled with fixed origins `https://orbit.vidorahub.com` and `http://localhost:3000` in `config/cors.ts`. Environment variables cannot replace or disable this allowlist. Credentials are supported; authentication remains required. Catalyst gateway preflights also require the project Authorized Domains configuration.

Competitor Search asks Gemini directly through the private Microservice suggestions endpoint. Backend validates and deduplicates the returned company URLs, stores AI-generated suggestions, and links detailed crawler reports. Browser dependencies were removed and AppSail memory is restored to 512 MB. No browser configuration is needed.
