"use client";
import { useEffect, useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import type { MarketingBudget, MarketingState } from "@/types/marketing";
import { createMarketingPlan, getMarketingPlan } from "../api/marketing";
import MarketingChannelCard from "./MarketingChannelCard";
import MarketingBudgetForm from "./MarketingBudgetForm";

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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">Budget-Driven Marketing Strategy</p>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">30-Day Planning Horizon</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Find the right marketing channels to grow</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-2xl sm:text-sm">
          Gemini synthesizes crawled evidence, audience hypotheses, and search trends to recommend channel allocations that maximize reach.
        </p>

        <MarketingBudgetForm daily={daily} setDaily={setDaily} monthly={monthly} setMonthly={setMonthly} currency={currency} setCurrency={setCurrency} valid={valid} cap={cap} money={money} busy={busy} submitting={submitting} loading={loading} jobCompleted={job?.status === "completed"} status={state?.status} hasResult={!!result} onSubmit={generate} />

        {job?.status !== "completed" && <p className="mt-3 text-xs text-slate-500">Run a website analysis above to unlock Gemini marketing recommendations.</p>}
        {busy && <p role="status" className="mt-3 animate-pulse text-xs font-medium text-violet-700">Your marketing plan is being computed in the background...</p>}
        {(error || state?.error) && <p role="alert" className="mt-3 text-xs text-red-700">{error || state?.error}</p>}
      </div>

      {result && (
        <>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900">{previous ? "Previous Plan" : "Recommended Strategy"}</h3>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Gemini Strategic Synthesis</span>
            </div>
            {savedBudget && <p className="mt-1 text-xs text-slate-500">Budget: {money(savedBudget.dailyBudget, savedBudget.currency)} / day · {money(savedBudget.monthlyBudget, savedBudget.currency)} / month</p>}
            <p className="mt-3 text-xs leading-relaxed text-slate-700 sm:text-sm">{result.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[["Daily pacing limit", result.effectiveDailyBudget], ["30-day budget ceiling", result.effectiveMonthlyBudget], ["Reserve buffer", result.unallocatedMonthly]].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{money(Number(val), result.currency as MarketingBudget["currency"])}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.channels.map((channel, idx) => (
              <MarketingChannelCard key={channel.name} channel={channel} index={idx} currency={result.currency as MarketingBudget["currency"]} money={money} />
            ))}
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 text-xs text-amber-950">
            <h4 className="font-bold">Strategic Considerations & Assumptions</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-amber-900 text-[11px] leading-relaxed">
              {result.assumptions.map(item => <li key={item}>{item}</li>)}
              <li>All budget allocations represent recommended caps for testing and iterative scaling.</li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
