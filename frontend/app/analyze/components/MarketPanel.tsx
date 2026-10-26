"use client";
import { useEffect, useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import type { MarketResearch, TrendInput } from "@/types/market";
import { getMarket, startMarket } from "../api/market";
const colors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777"];
export default function MarketPanel({ job }: { job: AnalysisJob | null }) {
  const [terms, setTerms] = useState(job?.analysis?.products.slice(0, 3).map(product => product.category || product.name).join(", ") || "");
  const [geo, setGeo] = useState("");
  const [timeframe, setTimeframe] = useState<TrendInput["timeframe"]>("today 12-m");
  const [state, setState] = useState<MarketResearch | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!job?.id);
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
    try { setState(await startMarket(job.id, { terms: [...new Set(terms.split(",").map(term => term.trim()).filter(Boolean))], geo, timeframe })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start research."); }
    finally { setLoading(false); }
  }
  const raw = state?.raw, result = state?.interpretation;
  return <section className="space-y-5">
    <div className="rounded-2xl border border-violet-100 bg-white p-6">
      <p className="text-xs font-semibold tracking-widest text-violet-600">GOOGLE TRENDS + GEMINI</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Explore your product&apos;s demand signals</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Compare search interest, discover regional patterns, and turn evidence into experiments. Interest is relative (0–100); it does not measure sales or market size.</p>
      <form onSubmit={event => { event.preventDefault(); void start(); }} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-slate-600 sm:col-span-2">Product categories <span className="text-slate-400">(1–5, separated by commas)</span><input required maxLength={404} value={terms} onChange={event => setTerms(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="project management software, task management" /></label>
        <label className="text-xs text-slate-600">Region<input aria-label="Two-letter country code, blank for worldwide" maxLength={2} pattern="[A-Z]{2}|" value={geo} onChange={event => setGeo(event.target.value.toUpperCase())} placeholder="Worldwide (or IN, US, GB…)" className="mt-2 block w-full rounded-lg border border-slate-200 p-3 text-sm" /></label>
        <label className="text-xs text-slate-600">Timeframe<select value={timeframe} onChange={event => setTimeframe(event.target.value as TrendInput["timeframe"])} className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"><option value="today 3-m">Past 3 months</option><option value="today 12-m">Past 12 months</option><option value="today 5-y">Past 5 years</option></select></label>
        <button disabled={loading || busy || job?.status !== "completed" || state?.status === "completed"} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{loading ? "Loading…" : busy ? state.status === "collecting" ? "Collecting Google Trends…" : "Gemini is interpreting saved evidence…" : state?.status === "completed" ? "Research saved" : state?.raw ? "Retry interpretation" : "Research Demand"}</button>
      </form>
      {job?.status !== "completed" && <p className="mt-3 text-xs text-slate-500">Complete a website analysis to research its product.</p>}
      <p className="mt-3 text-xs text-slate-400">One saved dataset per website report. Start a new website analysis to research different terms.</p>
      {busy && <p role="status" className="mt-3 text-sm text-violet-700">Research continues in the background. You can return to this report later.</p>}
      {(error || state?.error) && <p role="alert" className="mt-3 text-sm text-red-700">{error || state?.error}</p>}
    </div>
    {raw && <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="font-semibold text-slate-900">Search interest over time</h3><p className="mt-1 text-xs text-slate-500">{raw.config.geo || "Worldwide"} · Collected {new Date(raw.collectedAt).toLocaleString()} · Complete periods only</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{raw.metrics?.map(metric => <div key={metric.term} className="rounded-xl bg-violet-50 p-4"><p className="text-xs font-semibold text-violet-900">{metric.term}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{metric.recentMean}<span className="ml-1 text-xs font-normal text-slate-500">/100 recent average</span></p><p className="mt-2 text-xs text-slate-600">{metric.nonZeroPeriods === 0 ? "Insufficient search interest data" : metric.changePercent === null ? "No measurable earlier baseline" : `${metric.changePercent > 0 ? "+" : ""}${metric.changePercent}% vs earlier half`}</p></div>)}</div>
      <svg viewBox="0 0 600 180" role="img" aria-label="Relative search interest from zero to one hundred; full values in table below" className="mt-5 w-full"><path d="M20 10V160H590" fill="none" stroke="#cbd5e1" />{[0, 50, 100].map(value => <text key={value} x="0" y={163 - value * 1.5} fontSize="9" fill="#64748b">{value}</text>)}{raw.config.terms.map((term, index) => <polyline key={term} fill="none" stroke={colors[index]} strokeWidth="2" points={raw.timeline.map((point, i) => `${20 + i * 570 / Math.max(1, raw.timeline.length - 1)},${160 - (point.values[term] || 0) * 1.5}`).join(" ")} />)}</svg>
      <div className="flex flex-wrap gap-4 text-xs">{raw.config.terms.map((term, i) => <span key={term} style={{ color: colors[i] }}>{term}</span>)}</div>
      <div className="mt-3 flex justify-between text-xs text-slate-400"><span>{raw.timeline[0]?.date.slice(0, 10)}</span><span>{raw.timeline.at(-1)?.date.slice(0, 10)}</span></div>
      <details className="mt-4 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">View collected data</summary><div className="mt-3 max-h-72 overflow-auto"><table className="w-full text-left"><caption className="sr-only">Relative search interest for each complete period</caption><thead><tr><th>Date</th>{raw.config.terms.map(term => <th key={term}>{term}</th>)}</tr></thead><tbody>{raw.timeline.map(point => <tr key={point.date}><td className="py-1">{point.date.slice(0, 10)}</td>{raw.config.terms.map(term => <td key={term}>{point.values[term]}</td>)}</tr>)}</tbody></table></div><p className="mt-4 font-semibold">Regional interest</p>{raw.regions.map((region, i) => <p key={i} className="mt-1">{String(region.region)}: {raw.config.terms.map(term => `${term}: ${region[term] ?? 0}`).join(" · ")}</p>)}<p className="mt-4 font-semibold">Related searches</p>{Object.entries(raw.related).map(([term, queries]) => <p key={term} className="mt-1">{term}: {queries.join(", ") || "Unavailable"}</p>)}</details>
      {raw.warnings.map(warning => <p key={warning} className="mt-3 text-xs leading-5 text-amber-700">{warning}</p>)}
    </div>}
    {result && <div className="grid gap-4 sm:grid-cols-2">{[["Demand Signals", result.summary], ["Search Momentum", result.momentum], ["Seasonal Patterns", result.seasonality], ["Regional Interest", result.regionalInterest]].map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{text}</p></article>)}{[["Opportunities", result.opportunities], ["Next Experiments", result.nextSteps], ["Research Limits", result.limitations]].map(([title, items]) => <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-semibold text-violet-800">{title}</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-6 text-slate-600">{(items as string[]).map(item => <li key={item}>{item}</li>)}</ul></article>)}</div>}
  </section>;
}
