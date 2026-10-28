import type { ContentInjectionRecommendation } from "../types/seo";

export default function SeoRecommendationCard({
  recommendedTitle,
  titleRationale,
  recommendedDescription,
  descriptionRationale,
  recommendedH1,
  recommendedH2s,
  primaryKeywords,
  contentPlan,
}: {
  recommendedTitle: string;
  titleRationale: string;
  recommendedDescription: string;
  descriptionRationale: string;
  recommendedH1: string;
  recommendedH2s: string[];
  primaryKeywords: string[];
  contentPlan: ContentInjectionRecommendation[];
}) {
  return (
    <section aria-label="SEO Recommendations" className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Recommended Ranking Metadata & Heading Architecture</h3>
        <p className="text-[11px] text-slate-500">Engineered to capture competitor keywords while establishing brand authority</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">Recommended Title Tag</span>
            <span className="rounded-md bg-violet-200/60 px-2 py-0.5 text-[10px] font-bold text-violet-800">{recommendedTitle.length} chars</span>
          </div>
          <p className="text-xs font-bold text-slate-900">{recommendedTitle}</p>
          <p className="text-[11px] text-slate-600 leading-relaxed italic">{titleRationale}</p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Recommended Meta Description</span>
            <span className="rounded-md bg-indigo-200/60 px-2 py-0.5 text-[10px] font-bold text-indigo-800">{recommendedDescription.length} chars</span>
          </div>
          <p className="text-xs font-medium text-slate-800 leading-relaxed">{recommendedDescription}</p>
          <p className="text-[11px] text-slate-600 leading-relaxed italic">{descriptionRationale}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recommended H1 Heading</span>
          <p className="mt-1 text-xs font-bold text-slate-900">{recommendedH1}</p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recommended H2 Subheadings (Topical Authority)</span>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {recommendedH2s.map((h2, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs text-slate-800">
                <span className="font-bold text-violet-600">H2.{idx + 1}</span>
                <span className="font-medium">{h2}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority Target Keywords To Inject</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {primaryKeywords.map(kw => (
              <span key={kw} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                + {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Page Section Keyword Placement Blueprint</h4>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {contentPlan.map((plan, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-900">{plan.pageSection}</span>
              <div className="flex flex-wrap gap-1">
                {plan.recommendedKeywords.map(k => (
                  <span key={k} className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">{k}</span>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 font-mono leading-relaxed">
                &ldquo;{plan.suggestedCopySnippet}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
