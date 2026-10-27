"use client";
import { useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import { saveBrief, type BrandBrief } from "../api/workspace";

const fields: { key: keyof BrandBrief; label: string; placeholder: string; helper: string }[] = [
  { key: "product", label: "Your Product", placeholder: "What makes your offer unique in the market?", helper: "Key features, differentiators, and value proposition." },
  { key: "audience", label: "Target Audience", placeholder: "Who is your ideal customer profile?", helper: "Roles, company sizes, demographics, and acute pain points." },
  { key: "pastSteps", label: "Past Steps", placeholder: "What marketing channels and experiments have you tried?", helper: "Include past campaign results, conversion learnings, and failed tests." },
  { key: "futurePlans", label: "Future Plans", placeholder: "What growth initiatives are you eager to test next?", helper: "Upcoming product releases, channel expansions, or creative hooks." },
  { key: "goals", label: "Growth Goals", placeholder: "What are your primary KPIs and success targets?", helper: "Target MRR/ARR, customer acquisition targets, or brand awareness milestones." },
];

export default function BriefEditor({ job, focus, onSaved }: { job: AnalysisJob | null; focus: string; onSaved: (brief: BrandBrief) => void }) {
  const [brief, setBrief] = useState<BrandBrief>(job?.brief || { product: "", audience: "", pastSteps: "", futurePlans: "", goals: "" });
  const [saving, setSaving] = useState(false), [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const analysis = job?.analysis;

  async function save() {
    if (!job) return;
    setSaving(true); setMessage(""); setFailed(false);
    try {
      const saved = await saveBrief(job.id, brief);
      onSaved(saved);
      setMessage("Saved to this report.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xs">
      <div className="mb-6 max-w-xl">
        <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-semibold text-violet-700">FOUNDER & MARKETER BRIEF</span>
        <h2 className="mt-3 text-xl font-bold text-slate-900">{focus === "Past Steps" ? "Capture Past Lessons & Insights" : "Chart Your Upcoming Strategy"}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Provide personal context that public website crawlers cannot see. These notes persist with this report.</p>
      </div>

      {!job && (
        <p className="mb-6 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          Analyze a website first to link notes to an active report. You can draft your thoughts below in the meantime.
        </p>
      )}

      {analysis && (
        <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Observed From Website</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">{analysis.positioning.valueProposition.value}</p>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-5">
        {fields.map(field => {
          const isFocused = field.label === focus;
          return (
            <div key={field.key} className={isFocused ? "rounded-xl border border-violet-200 bg-violet-50/20 p-4" : ""}>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor={`brief-${field.key}`} className={`text-xs font-bold ${isFocused ? "text-violet-700" : "text-slate-700"}`}>
                  {field.label} {isFocused && <span className="ml-1 text-[10px] text-violet-600 font-normal">(Current Section)</span>}
                </label>
                <span className="text-[10px] text-slate-400">{brief[field.key]?.length || 0}/4000</span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">{field.helper}</p>
              <textarea
                id={`brief-${field.key}`}
                maxLength={4000}
                rows={isFocused ? 5 : 3}
                value={brief[field.key]}
                onChange={e => { setBrief({ ...brief, [field.key]: e.target.value }); setMessage(""); }}
                placeholder={field.placeholder}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
              />
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button disabled={!job || saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50">
            {saving ? "Saving…" : "Save Brief to Report ↗"}
          </button>
          {message && <p role={failed ? "alert" : "status"} className={`text-xs font-medium ${failed ? "text-red-600" : "text-emerald-700"}`}>{message}</p>}
        </div>
      </form>
    </section>
  );
}
