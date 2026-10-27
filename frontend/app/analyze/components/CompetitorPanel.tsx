"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCompetitors } from "@/app/hooks/useCompetitors";
import { analyzeCompetitor } from "../api/competitors";
import type { AnalysisJob } from "@/types/analysis";
import CompetitorCard from "./CompetitorCard";

function CompetitorSearch({ id }: { id: string }) {
  const { data, loading, error, busy, start, reconnect } = useCompetitors(id);
  const [opening, setOpening] = useState(""), [detailError, setDetailError] = useState("");
  const [filter, setFilter] = useState("");
  const router = useRouter();

  async function open(candidateId: string) {
    setOpening(candidateId); setDetailError("");
    try { const report = await analyzeCompetitor(id, candidateId); router.push(`/analyze?id=${report.id}`); }
    catch (cause) { setDetailError(cause instanceof Error ? cause.message : "Could not start competitor analysis."); }
    finally { setOpening(""); }
  }

  const results = data?.results.filter(c => !filter || c.title.toLowerCase().includes(filter.toLowerCase()) || c.domain.toLowerCase().includes(filter.toLowerCase()) || c.description.toLowerCase().includes(filter.toLowerCase())) || [];
  const stage = data?.status === "generating" ? "Gemini is identifying competitors for your business..." : "Preparing competitor landscape request...";

  return (
    <section className="space-y-6" aria-label="Competitor discovery">
      <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/70 via-white to-cyan-50/40 p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">Competitive Intelligence</p>
          <span className="rounded-full bg-violet-100/70 px-2.5 py-0.5 text-[10px] font-semibold text-violet-800">Gemini Synthesis</span>
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-slate-900">Discover competing brands in your orbit</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
              Gemini evaluates your crawled value proposition and market category to identify 10 key alternatives. Launch deep audits on any competitor with 1 click.
            </p>
          </div>
          {(!data || data.status === "failed") && (
            <button disabled={busy || loading} onClick={() => void start()} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50">
              {busy ? "Starting…" : data ? "Retry Competitor Discovery" : "Find Competitors ↗"}
            </button>
          )}
        </div>
      </div>

      {loading && <p role="status" className="animate-pulse text-xs font-medium text-slate-500">Opening saved competitor research…</p>}
      {busy && (
        <div role="status" className="rounded-xl border border-violet-200 bg-violet-50/80 p-5 text-xs text-violet-800">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-600" />
            <span className="font-semibold">{stage}</span>
          </div>
          <p className="mt-1 text-[11px] text-violet-600">This request is saved. You can navigate the rest of your workspace while it generates.</p>
        </div>
      )}

      {(error || detailError || data?.error) && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          {error || detailError || data?.error}
          {error && <button onClick={reconnect} className="ml-2 font-semibold underline">Reconnect</button>}
        </div>
      )}

      {!!data?.results.length && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{data.results.length} Competitors Identified</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-600">Domain-verified</span>
            </div>
            <input type="search" placeholder="Filter competitors..." value={filter} onChange={e => setFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-400 placeholder:text-slate-400" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((c, idx) => (
              <CompetitorCard key={c.id} c={c} idx={idx} opening={opening} onOpen={open} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function CompetitorPanel({ job }: { job: AnalysisJob | null }) {
  if (!job || job.status !== "completed") {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center">
        <h3 className="text-base font-bold text-slate-800">Analyze your brand first</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">A completed analysis provides the product and audience context necessary for accurate competitor discovery.</p>
      </div>
    );
  }
  return <CompetitorSearch key={job.id} id={job.id} />;
}
