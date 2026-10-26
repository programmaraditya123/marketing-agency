"use client";
import { useEffect, useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import type { MarketingBudget, MarketingState } from "@/types/marketing";
import { createMarketingPlan, getMarketingPlan } from "../api/marketing";
const currencies: MarketingBudget["currency"][] = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];
export default function MarketingPanel({ job }: { job: AnalysisJob | null }) {
  const [daily, setDaily] = useState(""), [monthly, setMonthly] = useState("");
  const [currency, setCurrency] = useState<MarketingBudget["currency"]>("INR");
  const [state, setState] = useState<MarketingState | null>(null);
  const [loading, setLoading] = useState(!!job?.id), [submitting, setSubmitting] = useState(false), [error, setError] = useState("");
  const id = job?.id, busy = state?.status === "generating";
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const saved = await getMarketingPlan(id!, controller.signal);
        if (controller.signal.aborted) return;
        setState(saved); setError("");
        if (saved) { setDaily(String(saved.budget.dailyBudget)); setMonthly(String(saved.budget.monthlyBudget)); setCurrency(saved.budget.currency); }
        if (saved?.status === "generating") timer = setTimeout(load, 2500);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load marketing plan."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [id, busy]);
  const valid = daily.trim() !== "" && monthly.trim() !== "" && Number.isFinite(Number(daily)) && Number.isFinite(Number(monthly)) && Number(daily) >= 0 && Number(monthly) >= 0;
  const cap = valid ? Math.min(Number(monthly), Number(daily) * 30) : null;
  function money(amount: number, code = currency) { return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(amount); }
  async function generate() {
    if (!id || !valid) return;
    setSubmitting(true); setError("");
    try { setState(await createMarketingPlan(id, { currency, dailyBudget: Number(daily), monthlyBudget: Number(monthly) })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not generate marketing plan."); }
    finally { setSubmitting(false); }
  }
  const result = state?.result || state?.previous?.result;
  const previous = !state?.result && !!state?.previous;
  const savedBudget = state?.result ? state.budget : state?.previous?.budget;
  return <section className="space-y-5">
    <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-7">
      <p className="text-xs font-semibold tracking-widest text-violet-600">YOUR PRODUCT. YOUR BUDGET.</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Find the right channels to grow</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Gemini uses your product, audience and any saved Trends evidence to recommend where to market, why it fits, and when to start.</p>
      <form onSubmit={event => { event.preventDefault(); void generate(); }} className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-slate-600">Currency<select disabled={busy || submitting || loading} value={currency} onChange={event => setCurrency(event.target.value as MarketingBudget["currency"])} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">{currencies.map(code => <option key={code}>{code}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Daily budget<input required type="number" min="0" max="100000000" step="0.01" inputMode="decimal" disabled={busy || submitting || loading} value={daily} onChange={event => setDaily(event.target.value)} placeholder="e.g. 500" className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
        <label className="text-xs font-medium text-slate-600">Monthly budget<input required type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" disabled={busy || submitting || loading} value={monthly} onChange={event => setMonthly(event.target.value)} placeholder="e.g. 10000" className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
        <div className="rounded-xl bg-violet-50 p-4 sm:col-span-3"><p className="text-sm font-medium text-violet-950">{cap === null ? "Enter both spending limits to plan your first 30 days." : `30-day planning cap: ${money(cap)}`}</p><p className="mt-2 text-xs leading-5 text-slate-500">We use the lower of your monthly budget and daily budget × 30. Daily pacing is capped at one thirtieth of that amount. Enter zero in either field for a plan without paid media.</p></div>
        <button disabled={!valid || loading || submitting || busy || job?.status !== "completed"} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 sm:col-span-3">{loading ? "Opening saved plan…" : busy || submitting ? "Building your channel plan…" : state?.status === "failed" ? "Retry Channel Plan" : result ? "Update Channel Plan" : "Find Marketing Channels"}</button>
      </form>
      {job?.status !== "completed" && <p className="mt-3 text-xs text-slate-500">Complete a website analysis first.</p>}
      {busy && <p role="status" className="mt-4 text-sm text-violet-700">Your plan is being generated in the background. You can return to this report later.</p>}
      {(error || state?.error) && <p role="alert" className="mt-4 text-sm text-red-700">{error || state?.error}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-400">Recommendations are saved privately with this report. You can change your budgets and generate a new plan. No campaigns are launched or money spent.</p>
    </div>
    {result && <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">{previous ? "Previous saved plan" : "Your channel strategy"}</h3><span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">Gemini recommendation</span></div>
        {previous && <p className="mt-3 text-xs text-amber-700">This plan uses your previous budget while the new request is pending or needs a retry.</p>}
        {savedBudget && <p className="mt-3 text-xs text-slate-500">Entered budget: {money(savedBudget.dailyBudget, savedBudget.currency)} daily / {money(savedBudget.monthlyBudget, savedBudget.currency)} monthly</p>}
        <p className="mt-3 text-sm leading-6 text-slate-600">{result.summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{[["Daily pacing cap", result.effectiveDailyBudget], ["30-day spending cap", result.effectiveMonthlyBudget], ["Monthly reserve", result.unallocatedMonthly]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-slate-900">{money(Number(value), result.currency as MarketingBudget["currency"])}</p></div>)}</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{result.channels.map((channel, index) => <article key={channel.name} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-widest text-violet-500">CHANNEL {index + 1} · {channel.approach.toUpperCase()}</p><h3 className="mt-2 text-lg font-semibold text-slate-900">{channel.name}</h3></div><span className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">{channel.allocationPercent}%</span></div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p><span className="block text-slate-400">Daily allocation</span><span className="mt-1 block font-semibold">{money(channel.dailyAllocation, result.currency as MarketingBudget["currency"])}</span></p><p><span className="block text-slate-400">Monthly allocation</span><span className="mt-1 block font-semibold">{money(channel.monthlyAllocation, result.currency as MarketingBudget["currency"])}</span></p></div>
        <dl className="mt-5 space-y-4 text-sm leading-6">{[["Why it fits", channel.why], ["When to use it", channel.when], ["Measure success", channel.successMetric], ["Scale or stop", channel.scaleOrStop]].map(([label, text]) => <div key={label}><dt className="text-xs font-semibold text-slate-800">{label}</dt><dd className="mt-1 text-slate-500">{text}</dd></div>)}</dl>
        <h4 className="mt-5 text-xs font-semibold text-slate-800">First steps</h4><ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-slate-500">{channel.firstSteps.map(step => <li key={step}>{step}</li>)}</ol>
      </article>)}</div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6"><h3 className="text-sm font-semibold text-amber-950">Planning assumptions</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-amber-900">{result.assumptions.map(item => <li key={item}>{item}</li>)}<li>Budgets are planning limits. Actual channel costs and results need testing; organic work still takes time and resources.</li><li>Allocations use a 30-day month and round down to the currency&apos;s minor unit. Unallocated funds remain a reserve.</li></ul></div>
    </>}
  </section>;
}
