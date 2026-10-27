import type { AnalysisJob, Finding } from "@/types/analysis";

function findings(value: unknown): Finding[] {
  if (!value || typeof value !== "object") return [];
  if ("basis" in value && "confidence" in value && "evidenceUrls" in value) return [value as Finding];
  return Object.values(value).flatMap(findings);
}

export default function AnalyticsPanel({ job }: { job: AnalysisJob | null }) {
  const all = findings(job?.analysis);
  const count = (basis: string) => all.filter(f => f.basis === basis).length;
  const metrics = [
    { label: "Observed", value: count("observed"), color: "bg-violet-600", desc: "Explicitly found on crawled website pages" },
    { label: "Inferred", value: count("inferred"), color: "bg-cyan-500", desc: "Deduce by Gemini based on surrounding facts" },
    { label: "Unknown", value: count("unknown"), color: "bg-amber-400", desc: "Not discovered in accessible crawl depth" },
  ];

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(job, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `orbit-research-${job?.startUrl?.replace(/[^a-z0-9]/gi, "_") || "report"}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/60 p-4 text-xs leading-relaxed text-cyan-950">
        <span className="font-bold">Evidence Assurance Note:</span> These metrics assess crawl depth and evidence reliability. Real-time traffic, ad spend, and conversion events require connected pixel credentials.
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        {[
          { label: "Pages Crawled", value: job?.totalPagesScraped ?? 0, sub: "Max 8 pages analyzed" },
          { label: "Social Accounts", value: job?.socialLinks?.length ?? 0, sub: "Discovered links" },
          { label: "Facts Assessed", value: all.length, sub: "Structured data points" },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{job ? item.value : "—"}</p>
            <p className="mt-1 text-[10px] text-slate-400">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Evidence Basis Breakdown</h3>
            <span className="text-[10px] font-semibold text-slate-400">{all.length} Total Findings</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Distribution of claims by empirical backing</p>

          <div className="mb-6 mt-6 flex h-4 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Evidence basis breakdown">
            {metrics.map(m => (
              <div key={m.label} className={m.color} style={{ width: `${all.length ? (m.value / all.length) * 100 : 0}%` }} />
            ))}
          </div>

          <div className="space-y-3">
            {metrics.map(m => (
              <div key={m.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${m.color}`} />
                  <div>
                    <span className="font-bold text-slate-800">{m.label}</span>
                    <span className="ml-2 hidden text-[11px] text-slate-400 sm:inline">({m.desc})</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900">{m.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div>
            <h3 className="font-bold text-slate-900">Report Metadata</h3>
            <p className="mt-1 text-xs text-slate-500">Technical crawl parameters & confidence summary</p>

            <dl className="mt-5 space-y-3 text-xs">
              {[
                { label: "Target Domain", val: job?.startUrl || "Not initiated" },
                { label: "Crawl Status", val: job?.status || "Pending" },
                { label: "High Confidence Facts", val: String(all.filter(f => f.confidence === "high").length) },
                { label: "Warnings Encountered", val: String(job?.warnings?.length || 0) },
              ].map(item => (
                <div key={item.label} className="flex justify-between border-b border-slate-100 pb-2.5">
                  <dt className="text-slate-400">{item.label}</dt>
                  <dd className="max-w-[200px] truncate font-medium text-slate-800">{item.val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button disabled={!job} onClick={download} className="w-full rounded-xl border border-violet-200 bg-violet-50/60 py-2.5 text-center text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-40">
              Export Structured JSON Report ↓
            </button>
          </div>
        </article>
      </div>

      {!!job?.warnings?.length && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900">
          <p className="font-bold">Crawl Notices & Gaps:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px]">
            {job.warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
