// Uses the installed Catalyst CLI's authenticated API client. Secret values stay
// in memory: they are never placed in app-config.json, arguments, or output.
const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const root = path.resolve(__dirname, '..');
const cliRoot = process.env.CATALYST_CLI_ROOT || path.join(process.env.APPDATA || '', 'npm/node_modules/zcatalyst-cli');
const cli = name => require(path.join(cliRoot, 'lib', name));
const apply = process.argv.includes('--apply');
const corsOnly = process.argv.includes('--cors-only');
const platformCors = process.argv.includes('--platform-cors');
const appCors = process.argv.includes('--app-cors');
async function main() {
  const rc = JSON.parse(fs.readFileSync(path.join(root, 'Backend/.catalystrc'), 'utf8'));
  const project = rc.projects.find(p => p.idx === rc.actives.project);
  const environment = project.env.find(e => e.idx === rc.actives.env);
  if (environment.name !== 'Development') throw new Error('This helper only targets the existing Development environment.');
  const runtime = cli('runtime-store').default;
  runtime.set('cli.package', require(path.join(cliRoot, 'package.json')));
  const scopes = cli('authentication/constants/scopes').default;
  cli('command_needs/auth').default([scopes.appsail_update]);
  const AppSail = cli('endpoints/lib/appsail').default;
  const api = new AppSail(project.id, { env: environment.name, envId: environment.id, log: { skipReqBody: true }, printError: false });
  const apps = await api.getAllAppsails();
  console.log(JSON.stringify({ environment: environment.name, apps: apps.map(app => ({ id: app.id, name: app.name, url: app.url, environmentKeys: Object.keys(app.configuration?.environment?.variables || {}) })) }, null, 2));
  if (!apply && !corsOnly) return;
  const micro = apps.find(app => app.name === 'market-agency');
  const backend = apps.find(app => app.name === 'market-agency-backend');
  if (!micro || !backend) throw new Error('Both existing AppSail services must be deployed before configuring them.');
  if (corsOnly) {
    for (const app of [micro, backend]) {
      const existing = app.configuration?.environment?.variables;
      if (!existing || !Object.keys(existing).length) throw new Error('Existing runtime environment is unavailable; refusing to replace it.');
      const origins = [...new Set([...(existing.CORS_ORIGINS || 'http://localhost:3000').split(',').map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean), 'https://orbit.vidorahub.com'])];
      await api.updateConfig(app.id, { ...existing, CORS_ORIGINS: origins.join(','), ...(platformCors ? { CORS_MANAGED_BY_CATALYST: 'true' } : appCors ? { CORS_MANAGED_BY_CATALYST: 'false' } : {}) });
      console.log(`${app.name}: allowed origins updated to ${origins.join(', ')}; other runtime settings preserved.`);
    }
    return;
  }
  const backendEnv = parseEnv(fs.readFileSync(path.join(root, 'Backend/.env'), 'utf8'));
  const microEnv = parseEnv(fs.readFileSync(path.join(root, 'Microservice/.env'), 'utf8'));
  if (!microEnv.GEMINI_API_KEY || !backendEnv.JWT_SECRET || !backendEnv.MONGODB_URI ||
    !backendEnv.MICROSERVICE_TOKEN || backendEnv.MICROSERVICE_TOKEN.length < 32 || backendEnv.MICROSERVICE_TOKEN !== microEnv.MICROSERVICE_TOKEN) throw new Error('Required local environment values are missing or the service tokens do not match.');
  const microUrl = new URL(micro.url);
  if (microUrl.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(microUrl.hostname)) throw new Error('A deployed HTTPS Microservice URL is required.');
  const nextMicro = { ...(micro.configuration?.environment?.variables || {}), GEMINI_API_KEY: microEnv.GEMINI_API_KEY,
    GEMINI_MODEL: microEnv.GEMINI_MODEL || 'gemini-2.5-flash', MICROSERVICE_TOKEN: microEnv.MICROSERVICE_TOKEN,
    CORS_ORIGINS: microEnv.CORS_ORIGINS || 'http://localhost:3000,https://orbit.vidorahub.com' };
  const nextBackend = { ...(backend.configuration?.environment?.variables || {}), MONGODB_URI: backendEnv.MONGODB_URI,
    MONGODB_DATABASE: backendEnv.MONGODB_DATABASE || 'marketing_agency', JWT_SECRET: backendEnv.JWT_SECRET,
    MICROSERVICE_TOKEN: backendEnv.MICROSERVICE_TOKEN, MICROSERVICE_URL: microUrl.origin,
    HOST: '0.0.0.0', NODE_ENV: 'production', COOKIE_SECURE: 'true', COOKIE_SAME_SITE: 'None',
    CORS_ORIGINS: backendEnv.CORS_ORIGINS || 'http://localhost:3000,https://orbit.vidorahub.com' };
  await api.updateConfig(micro.id, nextMicro);
  console.log('Microservice runtime environment updated (values omitted).');
  await api.updateConfig(backend.id, nextBackend);
  console.log('Backend runtime environment updated and connected to the deployed Microservice (values omitted).');
}
main().catch(() => { console.error('AppSail configuration failed. Check Catalyst login/network access and the required environment values; no secret values were printed.'); process.exitCode = 1; });
