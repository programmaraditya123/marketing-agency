import { loadEnvFile } from "node:process";
try { loadEnvFile(); } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
export function readEnv() {
  const port = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  const microserviceUrl = new URL(process.env.MICROSERVICE_URL || "http://127.0.0.1:8000");
  if (!["http:", "https:"].includes(microserviceUrl.protocol)) throw new Error("Invalid MICROSERVICE_URL");
  const serviceToken = required("MICROSERVICE_TOKEN");
  if (serviceToken.length < 32) throw new Error("MICROSERVICE_TOKEN must have at least 32 characters");
  const jwtSecret = required("JWT_SECRET");
  if (jwtSecret.length < 32 || jwtSecret === serviceToken) throw new Error("JWT_SECRET must be a separate random secret of at least 32 characters");
  const cookieSecure = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
  const cookieSameSite = process.env.COOKIE_SAME_SITE || "Lax";
  if (!["Lax", "Strict", "None"].includes(cookieSameSite) || (cookieSameSite === "None" && !cookieSecure)) throw new Error("Invalid cookie SameSite/Secure configuration");
  return {
    port, host: process.env.HOST || "0.0.0.0",
    mongoUri: process.env.MONGODB_URI?.trim() || required("MONGO_URI"), mongoDatabase: process.env.MONGODB_DATABASE || "marketing_agency",
    microserviceUrl: microserviceUrl.origin, serviceToken, jwtSecret, cookieSecure, cookieSameSite,
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000").split(",").map(s => s.trim()),
  };
}
export type Environment = ReturnType<typeof readEnv>;
