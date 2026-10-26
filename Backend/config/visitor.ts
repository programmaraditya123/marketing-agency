import { createHmac } from "node:crypto";
import { createJwt } from "./jwt";
export const VISITOR_LIFETIME = 365 * 86400;
export function createVisitorToken(secret: string) {
  // Different signing key prevents visitor proof being used as an account JWT.
  return createJwt(createHmac("sha256", secret).update("orbit:visitor:v1").digest("hex"));
}
