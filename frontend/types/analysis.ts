export interface Finding {
  value: string; basis: "observed" | "inferred" | "unknown";
  confidence: "high" | "medium" | "low"; evidenceUrls: string[];
}
export interface Analysis {
  company: { name: Finding; summary: Finding; industry: Finding; businessModel: Finding; locations: Finding };
  products: { name: string; description: Finding; category: string; benefits: string[]; pricing: Finding }[];
  targetAudience: { segment: string; description: Finding; needs: string[]; painPoints: string[]; buyingTriggers: string[]; suggestedChannels: string[] }[];
  positioning: { valueProposition: Finding; differentiators: Finding[]; brandVoice: Finding };
  contentThemes: string[];
  marketingOpportunities: { title: string; rationale: string; priority: string; suggestedAction: string; evidenceUrls: string[] }[];
  missingInformation: string[]; limitations: string[];
}
export interface AnalysisJob {
  brief?: import("@/app/analyze/api/workspace").BrandBrief;
  id: string; startUrl: string; status: "queued" | "crawling" | "analyzing" | "completed" | "failed";
  createdAt: string; updatedAt: string; error?: string; analysis?: Analysis;
  totalPagesScraped: number; sources: { url: string; title: string }[];
  socialLinks: { platform: string; url: string; discoveredOn: string }[]; warnings: string[];
}
