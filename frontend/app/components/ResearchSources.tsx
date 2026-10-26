import type { Analysis, AnalysisJob } from "@/types/analysis";
import { safeWebUrl } from "./FindingView";
import ReportSection, { DetailList } from "./ReportSection";
export default function ResearchSources({ job, analysis }: { job: AnalysisJob; analysis: Analysis }) {
  return <>
    <ReportSection title="Social presence" note="Profiles linked from the website. Posts, follower counts and engagement have not been analyzed."><div className="flex flex-wrap gap-3">{job.socialLinks.map(link => safeWebUrl(link.url) && <a key={link.url} href={safeWebUrl(link.url)} target="_blank" rel="noopener noreferrer" className="max-w-full break-all rounded-xl border border-slate-200 px-4 py-3 text-sm text-violet-800 hover:bg-violet-50">{link.platform} ↗<span className="mt-1 block text-xs text-slate-500">{link.url}</span></a>)}</div>{!job.socialLinks.length && <p className="text-sm text-slate-500">No social profiles were linked from the pages we could read.</p>}</ReportSection>
    <ReportSection title="Evidence & research gaps"><div className="grid gap-8 md:grid-cols-2"><div><h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pages explored</h4><ul className="mt-3 space-y-3">{job.sources.map(source => <li key={source.url}><a href={safeWebUrl(source.url)} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-violet-800 underline underline-offset-4">{source.title || source.url} ↗</a></li>)}</ul></div><div className="space-y-6"><DetailList title="Questions for your client" values={analysis.missingInformation} /><DetailList title="Limitations" values={[...new Set([...job.warnings, ...analysis.limitations])]} /></div></div></ReportSection>
  </>;
}
