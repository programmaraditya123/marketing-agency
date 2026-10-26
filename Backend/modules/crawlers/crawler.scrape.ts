import { fetchText } from "./crawler.fetch";
import { extractPage } from "./crawler.extract";
import type { Scrape } from "../../types/crawler";
import { AppError } from "../../utils/app-error";
export function robotsAllows(text: string): (path: string) => boolean {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group = { agents: [] as string[], rules: [] as { allow: boolean; path: string }[] };
  for (const line of text.split(/\r?\n/)) {
    const match = line.split("#")[0].trim().match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
    if (!match) continue;
    const [, key, value] = match;
    if (key.toLowerCase() === "user-agent") {
      if (group.rules.length) { groups.push(group); group = { agents: [], rules: [] }; }
      group.agents.push(value.toLowerCase());
    } else if (value) group.rules.push({ allow: key.toLowerCase() === "allow", path: value });
  }
  groups.push(group);
  const specific = groups.filter(g => g.agents.some(a => a !== "*" && "brandlensbot".includes(a)));
  const rules = (specific.length ? specific : groups.filter(g => g.agents.includes("*"))).flatMap(g => g.rules);
  return path => {
    const matched = rules.filter(rule => {
      const pattern = rule.path.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${pattern}`).test(path);
    }).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
    return !matched.length || matched[0].allow;
  };
}
export async function scrapeWebsite(startUrl: string, signal: AbortSignal): Promise<Scrape> {
  const origin = new URL(startUrl).origin;
  const result: Scrape = { startUrl, pages: [], socialLinks: [], warnings: [] };
  let allowed: (path: string) => boolean;
  try { allowed = robotsAllows((await fetchText(`${origin}/robots.txt`, origin, signal, "text")).text); }
  catch (error) {
    if (!(error instanceof AppError && error.message === "Website returned HTTP 404.")) {
      throw new AppError(422, "Could not verify robots.txt. Please try again later.");
    }
    allowed = () => true;
  }
  const queue = [startUrl];
  const seen = new Set<string>();
  while (queue.length && seen.size < 8) {
    if (signal.aborted && result.pages.length) {
      result.warnings.push("Crawl time limit reached; this report uses the pages collected so far."); break;
    }
    signal.throwIfAborted();
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    if (!allowed(new URL(next).pathname + new URL(next).search)) {
      result.warnings.push(`robots.txt disallows ${new URL(next).pathname}`); continue;
    }
    try {
      const response = await fetchText(next, origin, signal, "html", 0, allowed);
      if (!allowed(new URL(response.url).pathname)) continue;
      const extracted = extractPage(response.text, response.url);
      if (!result.pages.some(page => page.url === extracted.page.url)) result.pages.push(extracted.page);
      result.socialLinks.push(...extracted.socialLinks);
      const prioritized = extracted.links.sort((a, b) => Number(/about|product|service|solution|pricing|customer|contact/i.test(b)) - Number(/about|product|service|solution|pricing|customer|contact/i.test(a)));
      for (const link of prioritized) if (!seen.has(link) && !queue.includes(link) && queue.length < 40) queue.push(link);
    } catch (error) {
      result.warnings.push(`Could not read ${new URL(next).pathname}.`);
      if (next === startUrl) throw error;
    }
  }
  if (!result.pages.length) throw new AppError(422, "No accessible pages found. The website may block crawling.");
  result.socialLinks = [...new Map(result.socialLinks.map(link => [link.url, link])).values()].slice(0, 40);
  result.warnings.push("Social profiles are discovered links; their posts and follower demographics were not crawled.");
  return result;
}
