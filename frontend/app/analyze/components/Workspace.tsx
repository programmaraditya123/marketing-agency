"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnalysis } from "@/app/hooks/useAnalysis";
import AnalysisProgress from "@/app/components/AnalysisProgress";
import WorkspaceSidebar from "./WorkspaceSidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import WorkspaceOverview from "./WorkspaceOverview";
import ResearchPanel from "./ResearchPanel";
import BriefEditor from "./BriefEditor";
import HistoryPanel from "./HistoryPanel";
import CompetitorPanel from "./CompetitorPanel";
import MarketPanel from "./MarketPanel";
import MarketingPanel from "./MarketingPanel";
import ContentStrategyPanel from "./ContentStrategyPanel";
import SeoComparisonPanel from "./SeoComparisonPanel";
import { trackSection } from "../api/workspace";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Workspace({ initialId, initialWebsite, initialSection }: { initialId?: string; initialWebsite?: string; initialSection?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { job, error, submit, retry, loading, busy, updateBrief } = useAnalysis(initialId);
  const [active, setActive] = useState(initialSection || "Brand Overview");
  const [website, setWebsite] = useState(initialWebsite || "");
  const [targetCompetitor, setTargetCompetitor] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const started = useRef(false), lastViewed = useRef("");

  async function analyze(value: string) {
    const id = await submit(value);
    if (id) { setActive("Brand Overview"); router.replace(`/analyze?id=${id}`, { scroll: false }); }
  }

  useEffect(() => {
    if (initialWebsite && !initialId && !started.current) { started.current = true; void analyze(initialWebsite); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWebsite, initialId]);

  useEffect(() => {
    if (!job?.id || lastViewed.current === `${job.id}:${active}`) return;
    lastViewed.current = `${job.id}:${active}`;
    void trackSection(job.id, active).catch(() => setTrackingError("Activity sync paused. Report is saved."));
  }, [job?.id, active]);

  return (
    <main id="main-content" className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 bg-[#f8f9fd] lg:grid-cols-[250px_minmax(0,1fr)]">
      <WorkspaceSidebar active={active} onSelect={setActive} />
      <div className="min-w-0 px-4 py-5 sm:px-8 lg:px-10 lg:py-7">
        <WorkspaceHeader active={active} website={website} setWebsite={setWebsite} onAnalyze={analyze} busy={busy} loading={loading} job={job} isUser={!!user} />

        {error && (
          <div role="alert" className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-800">
            <span>{error}</span>
            <button className="font-semibold underline" onClick={() => window.location.reload()}>Reconnect</button>
          </div>
        )}
        {trackingError && <p role="status" className="mb-4 text-xs text-amber-700">{trackingError}</p>}
        {job?.parentAnalysisId && (
          <Link href={`/analyze?id=${job.parentAnalysisId}&view=competitors`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline">
            ← Back to competitor suggestions
          </Link>
        )}
        {loading && <p role="status" className="mb-5 animate-pulse text-xs font-medium text-violet-700">Loading saved research report…</p>}
        {job && job.status !== "completed" && <AnalysisProgress job={job} onRetry={retry} busy={busy} />}

        {active === "Search History" || active === "Your Activity" ? <HistoryPanel key={`${active}:${user?.id || "guest"}`} activity={active === "Your Activity"} />
          : active === "Past Steps" || active === "Future Plans" ? <BriefEditor key={job?.id || "empty"} job={job} focus={active} onSaved={updateBrief} />
          : active === "Marketing Plan" ? <MarketingPanel key={`${job?.id}:${job?.status}`} job={job} />
          : active === "Market Demand" ? <MarketPanel key={`${job?.id}:${job?.status}`} job={job} />
          : active === "Competitor Search" ? <CompetitorPanel job={job} onCompareSeo={(url) => { setTargetCompetitor(url); setActive("SEO Comparison"); }} />
          : active === "SEO Comparison" ? <SeoComparisonPanel key={`${job?.id}:${job?.status}`} job={job} initialCompetitor={targetCompetitor} />
          : active === "Content Strategy" || active === "Content Themes" ? <ContentStrategyPanel key={`${job?.id}:${job?.status}`} job={job} />
          : active === "Brand Overview" ? <WorkspaceOverview job={job} onSelect={setActive} />
          : <ResearchPanel key={`${job?.id}:${active}`} section={active} job={job} />}
      </div>
    </main>
  );
}
