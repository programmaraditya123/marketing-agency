"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/app/hooks/useAnalysis";
import AnalysisProgress from "@/app/components/AnalysisProgress";
import WorkspaceSidebar from "./WorkspaceSidebar";
import WorkspaceOverview from "./WorkspaceOverview";
import ResearchPanel from "./ResearchPanel";
import BriefEditor from "./BriefEditor";
import HistoryPanel from "./HistoryPanel";
import { trackSection } from "../api/workspace";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import CompetitorPanel from "./CompetitorPanel";
import MarketPanel from "./MarketPanel";
import MarketingPanel from "./MarketingPanel";
export default function Workspace({ initialId, initialWebsite, initialSection }: { initialId?: string; initialWebsite?: string; initialSection?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { job, error, submit, loading, busy, updateBrief } = useAnalysis(initialId);
  const [active, setActive] = useState(initialSection || "Brand Overview"), [website, setWebsite] = useState(initialWebsite || "");
  const [trackingError, setTrackingError] = useState("");
  const started = useRef(false), lastViewed = useRef("");
  async function analyze(value: string) {
    const id = await submit(value);
    if (id) { setActive("Brand Overview"); router.replace(`/analyze?id=${id}`, { scroll: false }); }
  }
  useEffect(() => {
    if (initialWebsite && !initialId && !started.current) { started.current = true; void analyze(initialWebsite); }
    // The URL initiates one job; refresh uses the saved ID once it is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWebsite, initialId]);
  useEffect(() => {
    if (!job?.id || lastViewed.current === `${job.id}:${active}`) return;
    lastViewed.current = `${job.id}:${active}`;
    void trackSection(job.id, active).catch(() => setTrackingError("Activity could not sync. Your report is still available."));
  }, [job?.id, active]);
  return <main id="main-content" className="mx-auto grid max-w-[1600px] grid-cols-1 bg-[#f8f9fd] lg:grid-cols-[245px_minmax(0,1fr)]">
    <WorkspaceSidebar active={active} onSelect={setActive} />
    <div className="min-w-0 px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-7 flex items-center justify-between border-b border-slate-200 pb-5"><p className="text-xs text-slate-400">Workspace <span className="mx-2">/</span><span className="text-slate-700">{active}</span></p><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500"><span className="mr-1.5 text-emerald-500">●</span>{user ? "Account workspace" : "Guest workspace"}</span></div>
      <div className="mb-7"><p className="mb-2 text-[10px] font-semibold tracking-[.16em] text-violet-600">FROM WEBSITE TO WHAT’S NEXT</p><h1 className="text-3xl font-semibold tracking-tight text-slate-900">{active === "Brand Overview" ? "Your next chapter starts here." : active}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{active === "Brand Overview" ? "Understand what you offer, who it’s for, and where to go next." : "A clearer picture. A more considered next move."}</p></div>
      <form onSubmit={event => { event.preventDefault(); void analyze(website.trim()); }} className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-100">
        <label htmlFor="workspace-url" className="sr-only">Website to analyze</label><div className="flex min-w-48 flex-1 items-center gap-3 px-3"><span aria-hidden="true" className="text-violet-400">◎</span><input id="workspace-url" required maxLength={2048} value={website} onChange={event => setWebsite(event.target.value)} placeholder="Enter your website, e.g. yourbrand.com" inputMode="url" className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></div>
        <button disabled={busy || loading} className="min-h-11 flex-1 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 sm:flex-none">{busy ? "Research in progress…" : "Analyze Website ↗"}</button>
      </form>
      <p className="mb-6 text-[11px] leading-5 text-slate-400">Searches and workspace activity are saved privately. Guest data stays linked to this browser; sign in to keep it across devices. Activity is retained for 90 days.</p>
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <button className="ml-2 underline" onClick={() => window.location.reload()}>Reconnect</button></div>}
      {trackingError && <p role="status" className="mb-4 text-xs text-amber-700">{trackingError}</p>}
      {job?.parentAnalysisId && <Link href={`/analyze?id=${job.parentAnalysisId}&view=competitors`} className="mb-5 inline-block text-xs font-semibold text-violet-600 hover:underline">← Back to competitor results</Link>}
      {loading && <p role="status" className="mb-6 text-sm text-violet-700">Opening your saved research…</p>}
      {job && job.status !== "completed" && <AnalysisProgress job={job} />}
      {active === "Search History" || active === "Your Activity" ? <HistoryPanel key={`${active}:${user?.id || "guest"}`} activity={active === "Your Activity"} />
        : active === "Past Steps" || active === "Future Plans" ? <BriefEditor key={job?.id || "empty"} job={job} focus={active} onSaved={updateBrief} />
        : active === "Marketing Plan" ? <MarketingPanel key={`${job?.id}:${job?.status}`} job={job} />
        : active === "Market Demand" ? <MarketPanel key={`${job?.id}:${job?.status}`} job={job} />
        : active === "Competitor Search" ? <CompetitorPanel job={job} />
        : active === "Brand Overview" ? <WorkspaceOverview job={job} onSelect={setActive} />
        : <ResearchPanel key={`${job?.id}:${active}`} section={active} job={job} />}
    </div>
  </main>;
}
