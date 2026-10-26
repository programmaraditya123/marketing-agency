import { createHash } from "node:crypto";
import { parse } from "tldts";
import { normalizeUrl } from "../crawlers/crawler.middleware";
import { AppError } from "../../utils/app-error";
import type { Competitor } from "../../types/competitor";

function companyDomain(value: string) {
  const url = normalizeUrl(value);
  const domain = parse(url.hostname, { allowPrivateDomains: true });
  if (!domain.domain || (!domain.isIcann && !domain.isPrivate)) throw new Error("Not a public business domain");
  return { url, domain: domain.domain };
}
export function validateCompetitors(payload: unknown, ownUrl: string): { results: Competitor[]; warnings: string[] } {
  if (!payload || typeof payload !== "object" || !("competitors" in payload) || !Array.isArray(payload.competitors) || !payload.competitors.length || payload.competitors.length > 10) {
    throw new AppError(502, "Gemini returned an invalid competitor list. Please try again.");
  }
  let own: string | undefined;
  try { own = companyDomain(ownUrl).domain; } catch { /* Numeric-IP reports have no business domain. */ }
  const unique = new Map<string, Competitor>();
  for (const item of payload.competitors) {
    if (!item || typeof item !== "object" || typeof item.name !== "string" || typeof item.website !== "string" || typeof item.description !== "string") throw new AppError(502, "Gemini returned an invalid competitor entry.");
    if (!item.name.trim() || item.name.length > 150 || item.description.trim().length < 10 || item.description.length > 600) throw new AppError(502, "Gemini returned an invalid competitor description.");
    try {
      const { url, domain } = companyDomain(item.website);
      if (domain === own || unique.has(domain)) continue;
      unique.set(domain, { id: createHash("sha256").update(domain).digest("hex").slice(0, 24), domain,
        url: `${url.origin}/`, title: item.name.trim(), description: item.description.trim() });
    } catch { /* Reject local, malformed, credentialed and custom-port URLs. */ }
  }
  const results = [...unique.values()];
  if (!results.length) throw new AppError(502, "Gemini did not return any usable competitor websites. Please try again.");
  return { results, warnings: results.length < 10 ? [`Gemini returned ${results.length} unique competitor suggestions. No extra companies were invented to reach ten.`] : [] };
}
