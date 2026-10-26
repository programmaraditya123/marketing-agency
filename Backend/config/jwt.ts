import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../utils/app-error";
const issuer = "orbit", audience = "orbit-api";
export function createJwt(secret: string) {
  const sign = (value: string) => createHmac("sha256", secret).update(value).digest();
  return {
    issue(sessionId: string, lifetime = 604800) {
      const now = Math.floor(Date.now() / 1000);
      const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
      const body = Buffer.from(JSON.stringify({ sub: sessionId, iss: issuer, aud: audience, iat: now, exp: now + lifetime })).toString("base64url");
      return `${header}.${body}.${sign(`${header}.${body}`).toString("base64url")}`;
    },
    verify(token: string): string {
      try {
        if (token.length > 2048) throw new Error();
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error();
        const [header, body, signature] = parts;
        const expected = sign(`${header}.${body}`), actual = Buffer.from(signature, "base64url");
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
        const h = JSON.parse(Buffer.from(header, "base64url").toString());
        const p = JSON.parse(Buffer.from(body, "base64url").toString());
        const now = Math.floor(Date.now() / 1000);
        if (h.alg !== "HS256" || h.typ !== "JWT" || p.iss !== issuer || p.aud !== audience ||
          typeof p.exp !== "number" || p.exp <= now || typeof p.iat !== "number" || p.iat > now + 30 ||
          typeof p.sub !== "string" || !/^[a-f0-9]{64}$/.test(p.sub)) throw new Error();
        return p.sub;
      } catch { throw new AppError(401, "Your session expired. Please sign in again."); }
    },
  };
}
