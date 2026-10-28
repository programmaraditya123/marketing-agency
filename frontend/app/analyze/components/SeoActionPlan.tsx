import type { ActionStep } from "../types/seo";

export default function SeoActionPlan({ steps }: { steps: ActionStep[] }) {
  return (
    <section aria-label="Ranking Action Plan" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Chronological SEO Execution Roadmap</h3>
        <span className="text-[11px] text-slate-500">Steps to outrank your competitor on Google</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map(step => (
          <div key={step.stepNumber} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
              {step.stepNumber}
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {step.estimatedImpactTime}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{step.action}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
