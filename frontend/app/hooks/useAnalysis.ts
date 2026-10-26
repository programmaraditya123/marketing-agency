"use client";
import { useCallback, useEffect, useState } from "react";
import { createAnalysis, getAnalysis } from "../api/analyses";
import type { AnalysisJob } from "@/types/analysis";
import type { BrandBrief } from "../analyze/api/workspace";
export function useAnalysis(initialId?: string) {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(!!initialId);
  useEffect(() => {
    const controller = new AbortController();
    if (initialId) void getAnalysis(initialId, controller.signal).then(setJob).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not open this report.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [initialId]);
  const id = job?.id;
  const terminal = job?.status === "completed" || job?.status === "failed";
  useEffect(() => {
    if (!id || terminal) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    async function poll() {
      setPolling(true);
      try {
        const next = await getAnalysis(id!, controller.signal);
        if (controller.signal.aborted) return;
        setJob(next);
        if (!["completed", "failed"].includes(next.status) && Date.now() - started < 240000) timer = setTimeout(poll, 2000);
        else { setPolling(false); if (!["completed", "failed"].includes(next.status)) setError("This is taking longer than expected. Refresh to check the saved analysis."); }
      } catch {
        if (!controller.signal.aborted) { setPolling(false); setError("Connection lost. Refresh to reconnect to your saved analysis."); }
      }
    }
    timer = setTimeout(poll, 500);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [id, terminal]);
  const submit = useCallback(async (value: string) => {
    setError(""); setSubmitting(true);
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Enter an HTTP or HTTPS website URL.");
      const created = await createAnalysis(url.href);
      setJob({ ...created, startUrl: url.href, createdAt: "", updatedAt: "", totalPagesScraped: 0, socialLinks: [], sources: [], warnings: [] });
      return created.id;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start analysis."); return null; }
    finally { setSubmitting(false); }
  }, []);
  function updateBrief(brief: BrandBrief) { setJob(previous => previous ? { ...previous, brief } : previous); }
  return { job, error, submit, loading, updateBrief, busy: submitting || polling || (!!job && !terminal && !error) };
}
