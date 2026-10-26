import type { AnalysisJob } from "@/types/analysis";
export default function AnalysisProgress({ job }: { job: AnalysisJob }) {
  const stages = ["queued", "crawling", "analyzing", "completed"];
  const current = stages.indexOf(job.status);
  const labels: Record<string, string> = { queued: "Your research is queued", crawling: "Exploring the website", analyzing: "Connecting the evidence", completed: "Your brand brief is ready", failed: "Research couldn’t finish" };
  return <section aria-live="polite" aria-busy={current >= 0 && current < 3} className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-widest text-slate-500">{job.startUrl}</p><h2 className="mt-2 text-xl font-semibold text-violet-950">{labels[job.status]}</h2></div><span className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-600">{job.totalPagesScraped} pages collected</span></div>
    {job.status === "failed" ? <p role="alert" className="mt-4 text-sm text-red-700">{job.error} You can submit the website again.</p> : <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{["Website received", "Collect website evidence", "Build brand analysis", "Report ready"].map((label, index) => <li key={label} className={`border-t-2 pt-3 text-xs ${index <= current ? "border-violet-700 text-violet-900" : "border-slate-200 text-slate-400"}`}>{index < current || current === 3 ? "✓ " : `${index + 1}. `}{label}</li>)}</ol>}
    {job.status === "analyzing" && <p className="mt-4 text-xs text-slate-500">Website evidence is saved. AI analysis may take another minute.</p>}
  </section>;
}
