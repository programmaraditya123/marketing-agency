"use client";
import type { AnalysisJob } from "@/types/analysis";

const sectionMeta: Record<string, { title: string; subtitle: string }> = {
  "Brand Overview": { title: "Brand Intelligence Dossier", subtitle: "Comprehensive summary of your offer, audience hypotheses, and market positioning." },
  "Your Product": { title: "Products & Core Services", subtitle: "Value propositions, verified features, and pricing structures from crawled evidence." },
  "Target Audience": { title: "Target Audience Insights", subtitle: "Customer segments, core pain points, and psychological buying triggers." },
  "Brand Voice": { title: "Brand Voice & Positioning", subtitle: "Brand tone, differentiation points, and core messaging architecture." },
  "Marketing Plan": { title: "Budget & Channel Strategy", subtitle: "Gemini-powered channel allocations and 30-day budget optimization." },
  "Competitor Search": { title: "Competitor Intelligence", subtitle: "AI-identified competitors in your orbit with 1-click deep research." },
  "Market Demand": { title: "Search Trends & Demand Signals", subtitle: "Historical search interest patterns and seasonal demand intelligence." },
  "Growth Ideas": { title: "Strategic Growth Opportunities", subtitle: "High-impact marketing actions and prioritized experimentation paths." },
  "Content Strategy": { title: "Social Content & Posting Strategy", subtitle: "AI-formulated platform recommendations, content formats, and optimal posting schedule tailored to your business." },
  "Content Themes": { title: "Campaign & Content Themes", subtitle: "Core narrative angles and messaging pillars tailored to your audience." },
  "Past Steps": { title: "Past Steps & Learnings", subtitle: "Document your previous experiments, lessons, and historic channel results." },
  "Future Plans": { title: "Future Marketing Roadmap", subtitle: "Define your upcoming priorities, milestone targets, and growth goals." },
  "Website Analytics": { title: "Research & Evidence Analytics", subtitle: "Evidence confidence breakdown, crawl depth metrics, and data export." },
  "Research Sources": { title: "Crawled Sources & Verification", subtitle: "Direct source URLs, pages explored, and verified evidence links." },
  "Search History": { title: "Your Analyzed Websites", subtitle: "Access previously generated reports and revisit historical brand audits." },
  "Your Activity": { title: "Workspace Activity Feed", subtitle: "Detailed audit trail of analyzed reports, viewed sections, and notes." },
};

export default function WorkspaceHeader({
  active,
  website,
  setWebsite,
  onAnalyze,
  busy,
  loading,
  job,
  isUser,
}: {
  active: string;
  website: string;
  setWebsite: (v: string) => void;
  onAnalyze: (v: string) => void;
  busy: boolean;
  loading: boolean;
  job: AnalysisJob | null;
  isUser: boolean;
}) {
  const meta = sectionMeta[active] || { title: active, subtitle: "A clearer picture for your next strategic move." };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Workspace</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800">{active}</span>
        </nav>
        <div className="flex items-center gap-2">
          {job?.startUrl && (
            <span className="max-w-[220px] truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              🌐 {job.startUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-600 shadow-2xs">
            <span className={`h-1.5 w-1.5 rounded-full ${isUser ? "bg-emerald-500" : "bg-amber-500"}`} />
            {isUser ? "Account" : "Guest Mode"}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-[.18em] text-violet-600">ORBIT BRAND INTELLIGENCE</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{meta.title}</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">{meta.subtitle}</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); onAnalyze(website.trim()); }} className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
        <label htmlFor="workspace-url" className="sr-only">Website URL</label>
        <div className="flex min-w-48 flex-1 items-center gap-2.5 px-3">
          <span aria-hidden="true" className="text-sm text-violet-500">🔍</span>
          <input id="workspace-url" required maxLength={2048} value={website} onChange={e => setWebsite(e.target.value)} placeholder="Analyze another website (e.g., stripe.com)" inputMode="url" className="h-10 w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm" />
        </div>
        <button disabled={busy || loading} className="flex min-h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50 sm:flex-none">
          {busy ? "Analyzing…" : "Analyze Website ↗"}
        </button>
      </form>
    </>
  );
}
