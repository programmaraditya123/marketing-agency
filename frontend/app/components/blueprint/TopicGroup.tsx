import type { BlueprintGroup, BlueprintTopic } from "./topics";
const tones = {
  violet: "border-violet-200 bg-violet-50/70 text-violet-900 hover:border-violet-400 hover:bg-violet-100",
  cyan: "border-cyan-200 bg-cyan-50/70 text-cyan-950 hover:border-cyan-400 hover:bg-cyan-100",
  amber: "border-amber-200 bg-amber-50/70 text-amber-950 hover:border-amber-400 hover:bg-amber-100",
};
export default function TopicGroup({ group, onSelect }: { group: BlueprintGroup; onSelect: (topic: BlueprintTopic, group: string) => void }) {
  return <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7">
    <div className="mb-5"><h3 className="text-lg font-semibold tracking-tight text-violet-950">{group.title}</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">{group.description}</p></div>
    <div className="flex flex-wrap items-start gap-2.5">{group.topics.map(topic => <button key={topic.id} type="button" aria-haspopup="dialog" onClick={() => onSelect(topic, group.title)}
      className={`group inline-flex min-h-12 max-w-full items-center gap-2 rounded-full border px-4 py-2.5 text-left text-sm font-medium leading-6 transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-violet-500 ${tones[group.tone]}`}>
      <span className="min-w-0 break-words">{topic.label}{topic.badge && <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wider opacity-65">{topic.badge}</span>}</span>
      {topic.count !== undefined && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white/80 px-1 text-[10px] font-semibold">{topic.count}</span>}
      <span aria-hidden="true" className="ml-1 shrink-0 text-base opacity-50 transition group-hover:opacity-100">↗</span>
    </button>)}</div>
    {!group.topics.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">{group.empty}</p>}
  </section>;
}
