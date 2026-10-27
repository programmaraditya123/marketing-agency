import { http1 } from "@/lib/http1";
import type { ContentStrategyState } from "@/types/content";

export async function getContentStrategy(id: string, signal?: AbortSignal) {
  return (await http1.get<{ data: ContentStrategyState | null }>(`/analyses/${id}/content-strategy`, signal)).data;
}

export async function createContentStrategy(id: string, focusGoal?: string) {
  return (await http1.post<{ data: ContentStrategyState }>(`/analyses/${id}/content-strategy`, { focusGoal })).data;
}
