"use client";
import { useEffect, useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import type { MarketResearch, TrendInput } from "@/types/market";
import { getMarket, startMarket } from "../api/market";
import MarketTrendsChart from "./MarketTrendsChart";
import MarketInsights from "./MarketInsights";

const colors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777"];

export default function MarketPanel({ job }: { job: AnalysisJob | null }) {
  const [terms, setTerms] = useState(job?.analysis?.products.slice(0, 3).map(p => p.category || p.name).join(", ") || "");
  const [geo, setGeo] = useState("");
  const [timeframe, setTimeframe] = useState<TrendInput["timeframe"]>("today 12-m");
  const [state, setState] = useState<MarketResearch | null>(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(!!job?.id);
  const busy = state?.status === "collecting" || state?.status === "analyzing";
  const reportId = job?.id;

  useEffect(() => {
    if (!reportId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const result = await getMarket(reportId!, controller.signal);
        if (controller.signal.aborted) return;
        setState(result); setError("");
        if (result) { setTerms(result.config.terms.join(", ")); setGeo(result.config.geo); setTimeframe(result.config.timeframe); }
        if (result?.status === "collecting" || result?.status === "analyzing") timer = setTimeout(load, 2500);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load research."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [reportId, busy]);

  async function start() {
    if (!job) return;
    setError(""); setLoading(true);
    try { setState(await startMarket(job.id, { terms: [...new Set(terms.split(",").map(t => t.trim()).filter(Boolean))], geo, timeframe })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start research."); }
    finally { setLoading(false); }
  }

  const raw = state?.raw, result = state?.interpretation;
  const suggestedTerms = job?.analysis?.products?.map(p => p.category || p.name).filter(Boolean) || [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">Google Trends & Demand Signals</p>
          <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-800">Pytrends + Gemini</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Measure real-world consumer interest</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
          Track relative search interest (0–100), identify seasonal shifts, and uncover geographic demand patterns.
        </p>

        {suggestedTerms.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400">Add suggested terms:</span>
            {suggestedTerms.slice(0, 4).map(term => (
              <button key={term} type="button" onClick={() => setTerms(prev => prev ? `${prev}, ${term}` : term)} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition">
                + {term}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); void start(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
            Search Terms <span className="font-normal text-slate-400">(1–5 terms, comma-separated)</span>
            <input required maxLength={404} value={terms} onChange={e => setTerms(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-violet-400 outline-none" placeholder="e.g. project management software, team productivity" />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Geographic Scope
            <input maxLength={2} pattern="[A-Z]{2}|" value={geo} onChange={e => setGeo(e.target.value.toUpperCase())} placeholder="Worldwide (or US, IN, GB...)" className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-violet-400 outline-none" />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Historical Timeframe
            <select value={timeframe} onChange={e => setTimeframe(e.target.value as TrendInput["timeframe"])} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-violet-400 outline-none">
              <option value="today 3-m">Past 3 months</option>
              <option value="today 12-m">Past 12 months</option>
              <option value="today 5-y">Past 5 years</option>
            </select>
          </label>
          <button disabled={loading || busy || job?.status !== "completed" || state?.status === "completed"} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50 sm:col-span-2">
            {loading ? "Loading…" : busy ? state?.status === "collecting" ? "Collecting Google Trends data…" : "Interpreting demand signals…" : state?.status === "completed" ? "Research saved to report" : state?.raw ? "Retry interpretation" : "Collect Demand Signals ↗"}
          </button>
        </form>

        {(error || state?.error) && <p role="alert" className="mt-3 text-xs text-red-700">{error || state?.error}</p>}
      </div>

      {raw && <MarketTrendsChart raw={raw} colors={colors} />}
      {result && <MarketInsights result={result} />}
    </section>
  );
}
