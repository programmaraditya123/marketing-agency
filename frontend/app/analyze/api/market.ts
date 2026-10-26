import { http1 } from "@/lib/http1";
import type { MarketResearch, TrendInput } from "@/types/market";
export async function getMarket(id: string, signal?: AbortSignal) {
  return (await http1.get<{ data: MarketResearch | null }>(`/analyses/${id}/market-research`, signal)).data;
}
export async function startMarket(id: string, input: TrendInput) {
  return (await http1.post<{ data: MarketResearch }>(`/analyses/${id}/market-research`, input)).data;
}
