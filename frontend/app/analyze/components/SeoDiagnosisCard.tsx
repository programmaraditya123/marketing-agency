import type { SeoGapFactor } from "../types/seo";

export default function SeoDiagnosisCard({
  diagnosis,
  opportunityScore,
  gapFactors,
}: {
  diagnosis: string;
  opportunityScore: number;
  gapFactors: SeoGapFactor[];
}) {
  return (
    <section aria-label="Competitive SEO Gap Diagnosis" className="space-y-4">
      <div className="rounded-2xl border border-rose-200/80 bg-linear-to-br from-rose-50/70 via-white to-amber-50/40 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">!</span>
            <h3 className="text-sm font-bold text-slate-900">Why Your Website Lacks Compared to Competitor</h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-rose-100/80 px-3 py-1 text-xs font-bold text-rose-800">
            <span>Organic Upside Potential:</span>
            <span className="text-sm text-rose-900 font-extrabold">+{opportunityScore}%</span>
          </div>
        </div>
        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
          {diagnosis}
        </p>
      </div>

      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Competitive Gap Factors</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {gapFactors.map((factor, idx) => {
            const isCritical = factor.impact === "critical";
            const leads = factor.status === "competitor_leads";
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{factor.category}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isCritical ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {factor.impact}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      leads ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {leads ? "Competitor Leads" : "Tied"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-rose-700 font-medium"><span className="font-bold">Your Weakness:</span> {factor.issue}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-800">Competitor Advantage:</span> {factor.whyCompetitorWins}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
