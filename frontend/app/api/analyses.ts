import { http1 } from "@/lib/http1";
import type { AnalysisJob } from "@/types/analysis";
export async function createAnalysis(startUrl: string) {
  const response = await http1.post<{ success: true; data: { id: string; status: "queued" } }>("/analyses", { startUrl });
  if (!/^[a-f0-9]{64}$/.test(response.data?.id)) throw new Error("Invalid analysis response.");
  return response.data;
}
export async function getAnalysis(id: string, signal?: AbortSignal) {
  const response = await http1.get<{ success: true; data: AnalysisJob }>(`/analyses/${encodeURIComponent(id)}`, signal);
  if (!response.data || !["queued", "crawling", "analyzing", "completed", "failed"].includes(response.data.status)) throw new Error("Invalid analysis response.");
  return response.data;
}
export async function retryAnalysis(id: string) {
  const response = await http1.post<{ success: true; data: { id: string; status: "analyzing" | "completed" } }>(`/analyses/${encodeURIComponent(id)}/retry`, {});
  return response.data;
}
