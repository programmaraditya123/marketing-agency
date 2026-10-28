"use client";
import { useEffect, useState } from "react";
import { getSeoComparison, startSeoComparison } from "../analyze/api/seo";
import type { SeoComparisonData } from "../analyze/types/seo";

export function useSeoComparison(id: string) {
  const [data, setData] = useState<SeoComparisonData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();

    async function poll() {
      try {
        const state = await getSeoComparison(id, controller.signal);
        if (controller.signal.aborted) return;
        setData(state);
        setLoading(false);
        if (state && state.status === "generating") {
          if (Date.now() - started > 180000) {
            setError("Analysis is taking longer than usual. Please refresh to inspect saved results.");
          } else {
            timer = setTimeout(poll, 3000);
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load SEO comparison data.");
          setLoading(false);
        }
      }
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, version]);

  async function compare(competitorUrl: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await startSeoComparison(id, competitorUrl);
      setData(res);
      setVersion(v => v + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not initiate SEO comparison.");
    } finally {
      setSubmitting(false);
    }
  }

  function selectCached(domain: string) {
    if (!data?.savedComparisons?.[domain]) return;
    setData({
      ...data,
      status: "completed",
      activeCompetitorDomain: domain,
      result: data.savedComparisons[domain],
    });
  }

  return {
    data,
    error,
    loading,
    busy: submitting || data?.status === "generating",
    compare,
    selectCached,
    reconnect: () => {
      setError("");
      setVersion(v => v + 1);
    },
  };
}
