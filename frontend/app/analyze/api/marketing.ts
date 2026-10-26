import { http1 } from "@/lib/http1";
import type { MarketingBudget, MarketingState } from "@/types/marketing";
export async function getMarketingPlan(id: string, signal?: AbortSignal) {
  return (await http1.get<{ data: MarketingState | null }>(`/analyses/${id}/marketing-plan`, signal)).data;
}
export async function createMarketingPlan(id: string, budget: MarketingBudget) {
  return (await http1.post<{ data: MarketingState }>(`/analyses/${id}/marketing-plan`, budget)).data;
}
