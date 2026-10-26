// Fixed allowlist: deployment environment variables cannot override these origins.
export const CORS_ORIGINS = [
  "https://orbit.vidorahub.com",
  "http://localhost:3000",
] as const;
