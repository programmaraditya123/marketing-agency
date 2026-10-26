"use client";
import { useState } from "react";
import type { Analysis, AnalysisJob } from "@/types/analysis";
import Modal from "@/components/ui/Modal";
import { buildBlueprintGroups, type BlueprintTopic } from "./blueprint/topics";
import TopicGroup from "./blueprint/TopicGroup";
import BlueprintDetails from "./blueprint/BlueprintDetails";
export default function AnalysisReport({ job, analysis }: { job: AnalysisJob; analysis: Analysis }) {
  const [selected, setSelected] = useState<{ topic: BlueprintTopic; group: string } | null>(null);
  const groups = buildBlueprintGroups(job, analysis);
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(job, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "orbit-brand-analysis.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section aria-labelledby="blueprint-title" className="mb-20 space-y-5">
    <div className="rounded-3xl border border-violet-200/70 bg-linear-to-br from-white via-white to-violet-50 p-6 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-5"><div className="min-w-0"><p className="mb-3 text-[10px] font-semibold tracking-[.2em] text-cyan-700">YOUR BRAND BLUEPRINT</p><h2 id="blueprint-title" className="break-words text-3xl font-semibold tracking-tight text-violet-950 sm:text-4xl">{analysis.company.name.value}</h2><p className="mt-2 break-all text-xs text-slate-500">{job.startUrl}</p></div><button type="button" onClick={download} className="shrink-0 rounded-full border border-violet-200 bg-white px-4 py-2.5 text-xs font-medium text-violet-800 transition hover:bg-violet-50">Download JSON ↓</button></div>
      <p className="mt-5 line-clamp-3 max-w-3xl text-sm leading-7 text-slate-600">{analysis.company.summary.value}</p>
      <div className="mt-5 flex flex-wrap gap-2">{[`${job.totalPagesScraped} pages explored`, `${analysis.products.length} products & services`, `${analysis.targetAudience.length} audience segments`].map(label => <span key={label} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] text-slate-500">{label}</span>)}</div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-violet-100 pt-5"><p className="text-xs leading-6 text-violet-700"><span aria-hidden="true">◎ </span> Select a heading bubble to explore the details and evidence.</p><p className="text-[10px] text-slate-400">Saved {new Date(job.updatedAt).toLocaleString()}</p></div>
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-2">{groups.map(group => <TopicGroup key={group.title} group={group} onSelect={(topic, title) => setSelected({ topic, group: title })} />)}</div>
    <Modal open={!!selected} title={selected?.topic.label || "Brand details"} eyebrow={selected ? `${analysis.company.name.value} / ${selected.group}` : undefined} onClose={() => setSelected(null)}>
      {selected && <BlueprintDetails detail={selected.topic.detail} />}
    </Modal>
  </section>;
}
