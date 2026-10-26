"use client";
import { useEffect, useState } from "react";
import { findCompetitors, getCompetitors } from "../analyze/api/competitors";
import type { CompetitorDiscovery } from "@/types/competitor";
export function useCompetitors(id: string) {
  const [data, setData] = useState<CompetitorDiscovery | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true), [starting, setStarting] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    async function poll() {
      try {
        const state = await getCompetitors(id, controller.signal);
        if (controller.signal.aborted) return;
        setData(state); setLoading(false);
        if (state && !["completed", "failed"].includes(state.status)) {
          if (Date.now() - started > 300000) setError("Search is taking longer than expected. Reconnect to check the saved results.");
          else timer = setTimeout(poll, 2000);
        }
      } catch (cause) {
        if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Could not load competitor search."); setLoading(false); }
      }
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [id, version]);
  async function start() {
    setStarting(true); setError("");
    try { setData(await findCompetitors(id)); setVersion(value => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start competitor discovery."); }
    finally { setStarting(false); }
  }
  return { data, error, loading, start, reconnect() { setError(""); setVersion(value => value + 1); },
    busy: starting || (!!data && !["completed", "failed"].includes(data.status)) };
}
