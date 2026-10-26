"use client";
import { useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import { saveBrief, type BrandBrief } from "../api/workspace";
const fields: { key: keyof BrandBrief; label: string; placeholder: string }[] = [
  { key: "product", label: "Your Product", placeholder: "What do you offer, and what makes it useful?" },
  { key: "audience", label: "Target Audience", placeholder: "Who are your customers? What do they need?" },
  { key: "pastSteps", label: "Past Steps", placeholder: "What have you tried so far? Share channels, campaigns, and lessons learned." },
  { key: "futurePlans", label: "Future Plans", placeholder: "What would you like to try next?" },
  { key: "goals", label: "Growth Goals", placeholder: "What would success look like? Include your timeline and priorities." },
];
export default function BriefEditor({ job, focus, onSaved }: { job: AnalysisJob | null; focus: string; onSaved: (brief: BrandBrief) => void }) {
  const [brief, setBrief] = useState<BrandBrief>(job?.brief || { product: "", audience: "", pastSteps: "", futurePlans: "", goals: "" });
  const [saving, setSaving] = useState(false), [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const analysis = job?.analysis;
  async function save() {
    if (!job) return;
    setSaving(true); setMessage(""); setFailed(false);
    try { const saved = await saveBrief(job.id, brief); onSaved(saved); setMessage("Your brief is saved to this report."); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Could not save. Please try again."); }
    finally { setSaving(false); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="mb-6 max-w-xl"><span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-medium text-violet-600">YOUR EXPERIENCE + YOUR RESEARCH</span><h2 className="mt-4 text-xl font-semibold text-slate-900">{focus === "Past Steps" ? "Every step teaches you something." : "Give your next move a direction."}</h2><p className="mt-3 text-xs leading-6 text-slate-500">Add the context your website can’t tell us. These notes stay connected to this report and remain separate from the AI’s findings.</p></div>
    {!job && <p className="mb-6 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">Analyze a website first to save your brand brief. You can draft your notes below while you decide.</p>}
    {analysis && <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50/50 p-4"><p className="text-[10px] font-semibold text-violet-700">FROM YOUR WEBSITE</p><p className="mt-2 text-xs leading-6 text-slate-600">{analysis.positioning.valueProposition.value}</p></div>}
    <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-5">{fields.map(field => <div key={field.key}><label htmlFor={`brief-${field.key}`} className={`mb-2 block text-xs font-semibold ${field.label === focus ? "text-violet-700" : "text-slate-700"}`}>{field.label}</label><textarea id={`brief-${field.key}`} maxLength={4000} rows={field.label === focus ? 5 : 3} value={brief[field.key]} onChange={event => { setBrief({ ...brief, [field.key]: event.target.value }); setMessage(""); }} placeholder={field.placeholder} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white" /><p className="mt-1 text-right text-[10px] text-slate-400">{brief[field.key].length}/4000</p></div>)}<div className="flex flex-wrap items-center gap-4"><button disabled={!job || saving} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{saving ? "Saving…" : "Save brand brief"}</button>{message && <p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600" : "text-emerald-700"}`}>{message}</p>}</div></form>
  </section>;
}
