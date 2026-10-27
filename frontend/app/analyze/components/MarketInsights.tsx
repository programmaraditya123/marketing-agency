import type { DemandAnalysis } from "@/types/market";

export default function MarketInsights({ result }: { result: DemandAnalysis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        ["Demand Signals", result.summary],
        ["Search Momentum", result.momentum],
        ["Seasonal Patterns", result.seasonality],
        ["Regional Interest", result.regionalInterest],
      ].map(([t, content]) => (
        <article key={t} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t}</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-line">{content}</p>
        </article>
      ))}
      <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Strategic Opportunities</h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-900 leading-relaxed">
          {result.opportunities.map(o => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </article>
      <article className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-violet-800">Suggested Next Experiments</h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-violet-900 leading-relaxed">
          {result.nextSteps.map(n => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
