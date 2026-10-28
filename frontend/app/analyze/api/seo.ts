import { http1 } from "@/lib/http1";
import type { SeoComparisonData } from "../types/seo";

export async function getSeoComparison(id: string, signal?: AbortSignal) {
  return (await http1.get<{ data: SeoComparisonData | null }>(`/analyses/${id}/seo-comparison`, signal)).data;
}

export async function startSeoComparison(id: string, competitorUrl: string) {
  return (await http1.post<{ data: SeoComparisonData }>(`/analyses/${id}/seo-comparison`, { competitorUrl })).data;
}
