"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCompetitors } from "@/app/hooks/useCompetitors";
import { analyzeCompetitor } from "../api/competitors";
import type { AnalysisJob } from "@/types/analysis";
function CompetitorSearch({ id }: { id: string }) {
  const { data, loading, error, busy, start, reconnect } = useCompetitors(id);
  const [opening, setOpening] = useState(""), [detailError, setDetailError] = useState("");
  const router = useRouter();
  async function open(candidateId: string) {
    setOpening(candidateId); setDetailError("");
    try { const report = await analyzeCompetitor(id, candidateId); router.push(`/analyze?id=${report.id}`); }
    catch (cause) { setDetailError(cause instanceof Error ? cause.message : "Could not start competitor analysis."); }
    finally { setOpening(""); }
  }
  const stage = data?.status === "generating" ? "Gemini is identifying competitors for your business..." : "Preparing your competitor request...";
  return <section className="space-y-5" aria-label="Competitor discovery">
    <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-white p-6 sm:p-8">
      <p className="text-[10px] font-semibold tracking-widest text-violet-600">A CLEARER VIEW OF YOUR MARKET</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-5"><div className="max-w-xl"><h2 className="text-xl font-semibold text-slate-900">Who else is in your orbit?</h2><p className="mt-3 text-sm leading-7 text-slate-500">Gemini uses your website, products and audience to suggest ten relevant competitors, with official website links and short descriptions. Explore any suggestion with a detailed website analysis.</p></div>
        {(!data || data.status === "failed") && <button disabled={busy || loading} onClick={() => void start()} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{busy ? "Starting…" : data ? "Try Again" : "Find Competitors ↗"}</button>}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-[10px] text-violet-700">{["01 · Business context", "02 · Gemini suggestions", "03 · Detailed analysis"].map(step => <span key={step} className="rounded-full border border-violet-100 bg-white px-3 py-2">{step}</span>)}</div>
    </div>
    {loading && <p role="status" className="text-sm text-slate-500">Opening saved competitor research…</p>}
    {busy && <div role="status" className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-700"><span className="mr-3 inline-block h-3 w-3 animate-pulse rounded-full bg-violet-500" />{stage}<p className="mt-2 text-xs">Your request is saved. You can return to this report while it runs.</p></div>}
    {(error || detailError || data?.error) && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error || detailError || data?.error}{error && <button onClick={reconnect} className="ml-3 font-semibold underline">Reconnect</button>}</div>}
    {!!data?.results.length && <><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">{data.results.length} potential {data.results.length === 1 ? "competitor" : "competitors"}</h3><span className="text-xs text-slate-400">One result per business domain</span></div><p className="text-xs leading-6 text-slate-500">These are AI-generated competitor suggestions, not live-verified search results. Names, website links and descriptions may be inaccurate. Detailed analysis checks the website evidence.</p>
      <div className="grid gap-4 xl:grid-cols-2">{data.results.map((competitor, index) => <article key={competitor.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
        <div className="mb-4 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-semibold text-violet-600">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h4 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">{competitor.title}</h4><a href={competitor.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-violet-600 hover:underline">{competitor.domain} ↗</a></div></div>
        <p className="mb-5 text-sm leading-7 text-slate-500">{competitor.description}</p>
        {competitor.analysisId ? <Link href={`/analyze?id=${competitor.analysisId}`} className="mt-auto rounded-xl border border-violet-200 px-4 py-3 text-center text-xs font-semibold text-violet-700 hover:bg-violet-50">Open Detailed Analysis ↗</Link> : <button disabled={!!opening} onClick={() => void open(competitor.id)} className="mt-auto rounded-xl border border-violet-200 px-4 py-3 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">{opening === competitor.id ? "Starting analysis…" : "Detailed Analysis ↗"}</button>}
      </article>)}</div><p className="text-[11px] text-slate-400">Saved {new Date(data.updatedAt).toLocaleString()} · Gemini-generated suggestions</p></>}
    {data?.warnings.map(warning => <p key={warning} role="status" className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800">{warning}</p>)}
  </section>;
}
export default function CompetitorPanel({ job }: { job: AnalysisJob | null }) {
  if (!job || job.status !== "completed") return <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center"><h2 className="text-lg font-semibold text-slate-800">Start with your business.</h2><p className="mt-3 text-sm leading-7 text-slate-500">Complete a website analysis first. Its products, audience and positioning guide the competitor search.</p></div>;
  return <CompetitorSearch key={job.id} id={job.id} />;
}
