export interface ScrapedPage {
  url: string; title: string; description: string; headings: string[];
  mainText: string; structuredData: unknown[]; scrapedAt: string;
}
export interface SocialLink { platform: string; url: string; discoveredOn: string }
export interface Scrape {
  startUrl: string; pages: ScrapedPage[]; socialLinks: SocialLink[]; warnings: string[];
}
export interface CrawlJob {
  contentStrategy?: import("./content").ContentStrategyState;
  seoComparison?: import("./seo").SeoComparisonState;
  marketingPlan?: import("./marketing").MarketingState;
  marketResearch?: import("./market").MarketResearch;
  userId?: string | null; visitorId?: string | null;
  competitors?: import("./competitor").CompetitorDiscovery;
  parentAnalysisId?: string; competitorId?: string;
  ownerId?: string; brief?: import("./auth").BrandBrief;
  _id: string; startUrl: string; status: "queued" | "crawling" | "analyzing" | "completed" | "failed";
  createdAt: string; updatedAt: string; scrape?: Scrape;
  analysis?: Record<string, unknown>; error?: string;
}
