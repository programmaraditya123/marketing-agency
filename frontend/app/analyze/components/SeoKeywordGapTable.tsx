import type { KeywordGapItem } from "../types/seo";

export default function SeoKeywordGapTable({
  keywordGaps,
  sharedKeywords,
}: {
  keywordGaps: KeywordGapItem[];
  sharedKeywords: string[];
}) {
  return (
    <section aria-label="Keyword Gap Analysis" className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Competitor Keyword Gap Matrix</h3>
          <p className="text-[11px] text-slate-500">High-intent search terms your competitor targets that your website is missing</p>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
          {keywordGaps.length} Target Opportunities
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Competitor Target Keyword</th>
              <th className="px-3 py-3">Search Intent</th>
              <th className="px-3 py-3">Impact</th>
              <th className="px-3 py-3">Your Status</th>
              <th className="px-4 py-3">Why It Drives Buyer Traffic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {keywordGaps.map((item, idx) => {
              const intentColor = item.searchIntent === "commercial" ? "bg-emerald-50 text-emerald-700"
                : item.searchIntent === "transactional" ? "bg-violet-50 text-violet-700"
                : "bg-cyan-50 text-cyan-700";
              const isMissing = item.clientStatus === "missing";
              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-bold text-slate-900">{item.keyword}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${intentColor}`}>
                      {item.searchIntent}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.impactLevel === "high" ? "bg-rose-50 text-rose-700 font-extrabold" : "bg-slate-100 text-slate-700"
                    }`}>
                      {item.impactLevel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      isMissing ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {isMissing ? "Missing" : "Weak"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-[11px] leading-relaxed max-w-sm">{item.whyItMatters}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!!sharedKeywords.length && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Shared Competitive Keywords</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sharedKeywords.map((kw, i) => (
              <span key={i} className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">{kw}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
