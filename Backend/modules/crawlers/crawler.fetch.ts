import http from "node:http";
import https from "node:https";
import { normalizeUrl, resolvePublic } from "./crawler.middleware";
import { AppError } from "../../utils/app-error";
export function sameWebsite(url: URL, origin: string): boolean {
  const initial = new URL(origin);
  return url.hostname.replace(/^www\./, "") === initial.hostname.replace(/^www\./, "") &&
    !(initial.protocol === "https:" && url.protocol !== "https:");
}
export async function fetchText(value: string, origin: string, signal: AbortSignal, kind = "html", redirects = 0, allowed: (path: string) => boolean = () => true): Promise<{ url: string; text: string }> {
  const url = normalizeUrl(value);
  if (!sameWebsite(url, origin)) throw new AppError(400, "Redirects to unrelated websites are not followed.");
  if (!allowed(url.pathname + url.search)) throw new AppError(422, "robots.txt disallows this page.");
  const record = await resolvePublic(url);
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    // Pin checked DNS while preserving the original Host header and TLS hostname.
    const request = (url.protocol === "https:" ? https : http).get(url, {
      signal, timeout: 10000, agent: false, family: record.family,
      lookup: (_hostname, _options, callback) => callback(null, record.address, record.family),
      headers: { "User-Agent": "BrandLensBot/1.0", Accept: kind === "html" ? "text/html" : "text/plain", "Accept-Encoding": "identity" },
    }, response => {
      const status = response.statusCode || 500;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        if (redirects >= 4) return reject(new AppError(422, "Too many website redirects."));
        let target: URL;
        try { target = new URL(response.headers.location, url); }
        catch { reject(new AppError(422, "Website returned an invalid redirect.")); return; }
        resolve(fetchText(target.href, origin, signal, kind, redirects + 1, allowed));
        return;
      }
      if (status < 200 || status >= 300) { response.resume(); reject(new AppError(422, `Website returned HTTP ${status}.`)); return; }
      if (kind === "html" && !response.headers["content-type"]?.includes("text/html")) {
        response.resume(); reject(new AppError(422, "Page is not HTML.")); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 2_000_000) response.destroy(new AppError(422, "Page exceeds the 2 MB crawl limit."));
        else chunks.push(chunk);
      });
      response.on("end", () => resolve({ url: url.href, text: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new AppError(504, "Website request timed out.")));
    request.on("error", reject);
  });
}
