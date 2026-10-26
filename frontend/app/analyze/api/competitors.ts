import { http1 } from "@/lib/http1";
import type { CompetitorDiscovery } from "@/types/competitor";
export async function getCompetitors(id: string, signal?: AbortSignal) {
  return (await http1.get<{ data: CompetitorDiscovery | null }>(`/analyses/${id}/competitors`, signal)).data;
}
export async function findCompetitors(id: string) {
  return (await http1.post<{ data: CompetitorDiscovery }>(`/analyses/${id}/competitors`, {})).data;
}
export async function analyzeCompetitor(id: string, candidateId: string) {
  return (await http1.post<{ data: { id: string; status: string } }>(`/analyses/${id}/competitors/${candidateId}/analysis`, {})).data;
}
