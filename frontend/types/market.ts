export interface TrendInput { terms: string[]; geo: string; timeframe: "today 12-m" | "today 3-m" | "today 5-y" }
export interface TrendData {
  source: string; collectedAt: string; config: TrendInput;
  timeline: { date: string; values: Record<string, number> }[];
  regions: Record<string, string | number>[]; related: Record<string, string[]>; warnings: string[];
  metrics: { term: string; earlierMean: number; recentMean: number; changePercent: number | null; peakDate: string; nonZeroPeriods: number }[];
}
export interface DemandAnalysis { summary: string; momentum: string; seasonality: string; regionalInterest: string; opportunities: string[]; nextSteps: string[]; limitations: string[] }
export interface MarketResearch {
  status: "collecting" | "analyzing" | "completed" | "failed";
  config: TrendInput; startedAt: string; updatedAt: string; raw?: TrendData; interpretation?: DemandAnalysis; error?: string;
}
