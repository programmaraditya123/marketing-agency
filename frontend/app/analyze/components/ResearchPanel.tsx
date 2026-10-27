import type { AnalysisJob } from "@/types/analysis";
import { buildBlueprintGroups } from "@/app/components/blueprint/topics";
import BlueprintDetails from "@/app/components/blueprint/BlueprintDetails";
import AnalyticsPanel from "./AnalyticsPanel";

export default function ResearchPanel({ section, job }: { section: string; job: AnalysisJob | null }) {
  if (section === "Website Analytics") return <AnalyticsPanel job={job} />;

  if (!job?.analysis || job.status !== "completed") {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center shadow-2xs">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-500">✧</span>
        <h3 className="mt-4 text-base font-bold text-slate-800">Awaiting Website Evidence</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
          {job && job.status !== "failed"
            ? "Orbit is currently extracting evidence and synthesizing this section. Your report will populate automatically."
            : "Submit a public website above to populate verified product features, target personas, and growth opportunities."}
        </p>
      </div>
    );
  }

  const groupIndex: Record<string, number> = { "Your Product": 1, "Target Audience": 2, "Brand Voice": 3, "Growth Ideas": 4, "Content Themes": 4, "Research Sources": 5 };
  const group = buildBlueprintGroups(job, job.analysis)[groupIndex[section] ?? 0];
  const topics = section === "Content Themes" ? group.topics.filter(t => t.id === "themes") : section === "Growth Ideas" ? group.topics.filter(t => t.id !== "themes") : group.topics;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <p className="text-xs font-medium text-slate-600">{group.description}</p>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-semibold text-violet-700">
          Evidence-Linked Findings
        </span>
      </div>

      {section === "Target Audience" && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900">
          <span className="font-bold">Audience Validation Reminder:</span> These personas represent research hypotheses derived from public website messaging. Validate with customer interviews and live test campaigns.
        </div>
      )}

      {topics.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-500">
          {group.empty || "No findings detected in the crawled evidence."}
        </div>
      )}

      {topics.map(topic => (
        <article key={topic.id} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-violet-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">{topic.label}</h3>
            {topic.badge && <span className="rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">{topic.badge}</span>}
          </div>
          <BlueprintDetails detail={topic.detail} />
        </article>
      ))}
    </section>
  );
}
