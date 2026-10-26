import { http1 } from "@/lib/http1";
import type { AnalysisJob } from "@/types/analysis";
export interface BrandBrief { product: string; audience: string; pastSteps: string; futurePlans: string; goals: string }
export interface HistoryItem { id: string; startUrl: string; status: AnalysisJob["status"]; createdAt: string; updatedAt: string }
export interface ActivityItem { id: string; type: string; detail: string; analysisId?: string; createdAt: string }
export interface Page<T> { items: T[]; nextCursor: string | null }
export async function getHistory(cursor?: string) {
  return (await http1.get<{ data: Page<HistoryItem> }>(`/history${cursor ? `?before=${encodeURIComponent(cursor)}` : ""}`)).data;
}
export async function getActivity(cursor?: string) {
  return (await http1.get<{ data: Page<ActivityItem> }>(`/activity${cursor ? `?before=${encodeURIComponent(cursor)}` : ""}`)).data;
}
export async function saveBrief(id: string, brief: BrandBrief) {
  return (await http1.post<{ data: BrandBrief }>(`/analyses/${id}/brief`, brief)).data;
}
export async function trackSection(analysisId: string, section: string) {
  await http1.post("/activity", { analysisId, section });
}
