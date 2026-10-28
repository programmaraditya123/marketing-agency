import { load } from "cheerio";
import type { ScrapedPage } from "../../types/crawler";
import type { WebsiteSeoInput } from "../../types/seo";

export function extractSeoFromHtml(html: string, pageUrl: string): WebsiteSeoInput {
  const $ = load(html);

  const title = ($("title").first().text() || $('meta[property="og:title"]').attr("content") || "").trim().slice(0, 500);
  const description = (
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    ""
  ).trim().slice(0, 1500);

  const metaKeywords = ($('meta[name="keywords"]').attr("content") || "").trim().slice(0, 1000);
  const canonical = ($('link[rel="canonical"]').attr("href") || "").trim().slice(0, 1000) || undefined;
  const openGraphTitle = ($('meta[property="og:title"]').attr("content") || "").trim().slice(0, 500) || undefined;
  const openGraphDescription = ($('meta[property="og:description"]').attr("content") || "").trim().slice(0, 1000) || undefined;

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    const tag = (el as { tagName?: string }).tagName?.toUpperCase() || "H";
    if (text && text.length > 2 && headings.length < 35) {
      headings.push(`${tag}: ${text.slice(0, 180)}`);
    }
  });

  const structuredDataTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const extractType = (obj: Record<string, unknown>) => {
        if (!obj || typeof obj !== "object") return;
        const type = obj["@type"];
        if (typeof type === "string" && !structuredDataTypes.includes(type)) {
          structuredDataTypes.push(type);
        } else if (Array.isArray(type)) {
          for (const t of type) {
            if (typeof t === "string" && !structuredDataTypes.includes(t)) structuredDataTypes.push(t);
          }
        }
        if (Array.isArray(obj["@graph"])) {
          for (const g of obj["@graph"] as Record<string, unknown>[]) extractType(g);
        }
      };
      if (Array.isArray(parsed)) {
        for (const item of parsed) extractType(item);
      } else {
        extractType(parsed);
      }
    } catch {
      // Ignore invalid JSON-LD
    }
  });

  $("script, style, noscript, svg, iframe, nav, footer").remove();
  const sampleText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000);

  return {
    url: pageUrl,
    title,
    description,
    headings,
    metaKeywords,
    canonical,
    openGraphTitle,
    openGraphDescription,
    structuredDataTypes: structuredDataTypes.slice(0, 15),
    sampleText,
  };
}

export function buildSeoInputFromScrapedPages(pages: ScrapedPage[], fallbackUrl: string): WebsiteSeoInput {
  if (!pages.length) {
    return {
      url: fallbackUrl,
      title: "",
      description: "",
      headings: [],
      metaKeywords: "",
      structuredDataTypes: [],
      sampleText: "",
    };
  }

  const home = pages[0];
  const headings = [...home.headings].slice(0, 30);
  const structuredDataTypes: string[] = [];

  for (const item of home.structuredData) {
    if (item && typeof item === "object") {
      const type = (item as Record<string, unknown>)["@type"];
      if (typeof type === "string" && !structuredDataTypes.includes(type)) {
        structuredDataTypes.push(type);
      }
    }
  }

  // Combine key text from first 2 pages
  const sampleText = pages
    .slice(0, 3)
    .map(p => p.mainText)
    .join(" ")
    .slice(0, 6000);

  return {
    url: home.url || fallbackUrl,
    title: home.title || "",
    description: home.description || "",
    headings,
    metaKeywords: "",
    structuredDataTypes: structuredDataTypes.slice(0, 15),
    sampleText,
  };
}
