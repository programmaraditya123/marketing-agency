import type { MarketingBudget } from "@/types/marketing";

const currencies: MarketingBudget["currency"][] = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];

export default function MarketingBudgetForm({
  daily,
  setDaily,
  monthly,
  setMonthly,
  currency,
  setCurrency,
  valid,
  cap,
  money,
  busy,
  submitting,
  loading,
  jobCompleted,
  status,
  hasResult,
  onSubmit,
}: {
  daily: string;
  setDaily: (v: string) => void;
  monthly: string;
  setMonthly: (v: string) => void;
  currency: MarketingBudget["currency"];
  setCurrency: (v: MarketingBudget["currency"]) => void;
  valid: boolean;
  cap: number | null;
  money: (amount: number, code?: MarketingBudget["currency"]) => string;
  busy: boolean;
  submitting: boolean;
  loading: boolean;
  jobCompleted: boolean;
  status?: string;
  hasResult: boolean;
  onSubmit: () => Promise<void>;
}) {
  function setPreset(d: number, m: number) { setDaily(String(d)); setMonthly(String(m)); }

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400">Quick Presets:</span>
        {[
          { label: "Zero-Budget (Organic)", d: 0, m: 0 },
          { label: currency === "INR" ? "Starter (₹15k/mo)" : "Starter ($250/mo)", d: currency === "INR" ? 500 : 10, m: currency === "INR" ? 15000 : 250 },
          { label: currency === "INR" ? "Growth (₹60k/mo)" : "Growth ($1k/mo)", d: currency === "INR" ? 2000 : 40, m: currency === "INR" ? 60000 : 1000 },
          { label: currency === "INR" ? "Scale (₹2.5L/mo)" : "Scale ($3.5k/mo)", d: currency === "INR" ? 8500 : 120, m: currency === "INR" ? 250000 : 3500 },
        ].map(p => (
          <button key={p.label} type="button" onClick={() => setPreset(p.d, p.m)} className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-800 transition">
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); void onSubmit(); }} className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">
          Currency
          <select disabled={busy || submitting || loading} value={currency} onChange={e => setCurrency(e.target.value as MarketingBudget["currency"])} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-violet-400">
            {currencies.map(code => <option key={code}>{code}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Daily Budget
          <input required type="number" min="0" max="100000000" step="0.01" inputMode="decimal" disabled={busy || submitting || loading} value={daily} onChange={e => setDaily(e.target.value)} placeholder="e.g. 500" className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-violet-400" />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Monthly Budget
          <input required type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" disabled={busy || submitting || loading} value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="e.g. 15000" className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-violet-400" />
        </label>

        <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3.5 sm:col-span-3 text-xs">
          <p className="font-bold text-violet-950">{cap === null ? "Enter budgets to calculate your 30-day allocation." : `Calculated 30-day effective cap: ${money(cap)}`}</p>
          <p className="mt-1 text-[11px] text-slate-500">Uses the lower of your monthly budget and daily budget × 30.</p>
        </div>

        <button disabled={!valid || loading || submitting || busy || !jobCompleted} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50 sm:col-span-3">
          {loading ? "Checking saved plan…" : busy || submitting ? "Synthesizing channel roadmap…" : status === "failed" ? "Retry Channel Plan" : hasResult ? "Update Marketing Plan" : "Generate Marketing Plan ↗"}
        </button>
      </form>
    </>
  );
}
