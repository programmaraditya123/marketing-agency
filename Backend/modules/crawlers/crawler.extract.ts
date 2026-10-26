import { load } from "cheerio";
import type { ScrapedPage, SocialLink } from "../../types/crawler";
const platforms: Record<string, string> = {
  "instagram.com": "Instagram", "facebook.com": "Facebook", "linkedin.com": "LinkedIn",
  "x.com": "X", "twitter.com": "X", "youtube.com": "YouTube", "tiktok.com": "TikTok", "pinterest.com": "Pinterest",
};
export function extractPage(html: string, url: string) {
  const $ = load(html);
  const socialLinks: SocialLink[] = [];
  const links: string[] = [];
  $("a[href]").each((_, element) => {
    try {
      const link = new URL($(element).attr("href")!, url);
      if (!["https:", "http:"].includes(link.protocol) || link.username || link.password) return;
      link.hash = ""; link.search = "";
      const host = link.hostname.replace(/^www\./, "");
      const platform = Object.entries(platforms).find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1];
      if (platform && !/\/share|\/intent|sharer|\/login/.test(link.pathname)) socialLinks.push({ platform, url: link.href, discoveredOn: url });
      if (link.origin === new URL(url).origin && !/\.(pdf|png|jpe?g|zip|svg|webp|mp4)$/i.test(link.pathname)) links.push(link.href);
    } catch { /* Ignore malformed links. */ }
  });
  const structuredData: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text();
    if (raw.length > 12000 || structuredData.length >= 10) return;
    try { structuredData.push(JSON.parse(raw)); } catch { /* Broken website JSON-LD. */ }
  });
  const title = $("title").first().text().trim().slice(0, 500);
  const description = ($('meta[name="description"]').attr("content") || "").slice(0, 1500);
  $("script, style, noscript, svg, iframe").remove();
  const headings = $("h1, h2, h3").map((_, e) => $(e).text().trim().slice(0, 300)).get().filter(Boolean).slice(0, 40);
  const page: ScrapedPage = { url, title, description, headings, structuredData,
    mainText: $("body").text().replace(/\s+/g, " ").trim().slice(0, 14000), scrapedAt: new Date().toISOString() };
  return { page, links: [...new Set(links)].slice(0, 200), socialLinks };
}
