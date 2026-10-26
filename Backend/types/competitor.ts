export interface Competitor { id: string; domain: string; url: string; title: string; description: string; analysisId?: string }
export interface CompetitorDiscovery {
  provider: "gemini";
  status: "queued" | "generating" | "completed" | "failed";
  results: Competitor[]; warnings: string[]; updatedAt: string; error?: string;
}
