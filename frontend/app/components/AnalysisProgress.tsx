import type { AnalysisJob } from "@/types/analysis";

export default function AnalysisProgress({ job, onRetry, busy }: { job: AnalysisJob; onRetry?: () => void; busy?: boolean }) {
  const stages = ["queued", "crawling", "analyzing", "completed"];
  const current = stages.indexOf(job.status);
  const labels: Record<string, string> = {
    queued: "Your research job is queued",
    crawling: "Crawling public pages & extracting copy",
    analyzing: "Synthesizing evidence & audience hypotheses",
    completed: "Your brand intelligence report is ready",
    failed: "Crawl or analysis could not finish",
  };

  const steps = [
    { name: "Target Received", desc: "URL sanitized" },
    { name: "Crawl Evidence", desc: "Extracting pages & links" },
    { name: "AI Analysis", desc: "Audience & positioning" },
    { name: "Report Synthesis", desc: "Ready to inspect" },
  ];

  return (
    <section aria-live="polite" aria-busy={current >= 0 && current < 3} className="mb-8 rounded-2xl border border-violet-100 bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
            <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">Live Pipeline</p>
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{labels[job.status] || "Processing analysis"}</h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{job.startUrl}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {job.totalPagesScraped} {job.totalPagesScraped === 1 ? "page" : "pages"} crawled
        </span>
      </div>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-linear-to-r from-violet-600 to-cyan-400 transition-all duration-700 ease-out"
          style={{ width: current === -1 ? "10%" : `${Math.max(15, (current + 1) * 25)}%` }}
        />
      </div>

      {job.status === "failed" ? (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-red-800">Analysis Failed:</p>
              <p className="mt-1 text-slate-700">{job.error || "The website could not be crawled. Check if it is accessible publicly."}</p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer"
              >
                <span>{busy ? "Retrying…" : "🔄 Retry Analysis"}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((step, index) => {
            const isDone = index < current || current === 3;
            const isCurrent = index === current;
            return (
              <li key={step.name} className={`rounded-xl border p-3 text-xs transition ${isCurrent ? "border-violet-300 bg-violet-50/50" : isDone ? "border-slate-200 bg-slate-50/50" : "border-slate-100 bg-white opacity-50"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">0{index + 1}</span>
                  {isDone && <span className="text-xs font-bold text-violet-600">✓</span>}
                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-ping" />}
                </div>
                <p className={`mt-2 font-bold ${isCurrent ? "text-violet-900" : isDone ? "text-slate-800" : "text-slate-400"}`}>{step.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
