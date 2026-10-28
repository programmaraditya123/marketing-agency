"use client";
import { useState } from "react";
import { useSeoComparison } from "@/app/hooks/useSeoComparison";
import type { AnalysisJob } from "@/types/analysis";
import SeoScorecard from "./SeoScorecard";
import SeoDiagnosisCard from "./SeoDiagnosisCard";
import SeoKeywordGapTable from "./SeoKeywordGapTable";
import SeoRecommendationCard from "./SeoRecommendationCard";
import SeoCopyableSnippet from "./SeoCopyableSnippet";
import SeoActionPlan from "./SeoActionPlan";

export default function SeoComparisonPanel({ job, initialCompetitor }: { job: AnalysisJob | null; initialCompetitor?: string }) {
  const { data, loading, busy, error, compare, selectCached } = useSeoComparison(job?.id || "");
  const [competitorInput, setCompetitorInput] = useState(initialCompetitor || "");

  if (!job || job.status !== "completed") {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center">
        <h3 className="text-base font-bold text-slate-800">Analyze your website first</h3>
        <p className="mt-2 text-xs text-slate-500">A completed website analysis provides the baseline metadata required for competitive audit.</p>
      </div>
    );
  }

  const result = data?.result;
  const savedKeys = Object.keys(data?.savedComparisons || {});

  return (
    <section className="space-y-6" aria-label="SEO Comparison War Room">
      <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/70 via-white to-cyan-50/40 p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">Competitive SEO & Keyword War Room</p>
          <span className="rounded-full bg-violet-100/70 px-2.5 py-0.5 text-[10px] font-semibold text-violet-800">Primary USP</span>
        </div>
        <h2 className="mt-3 text-xl font-bold text-slate-900">Compare SEO metadata & keywords against any competitor</h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
          Uncover why your website lacks search visibility against your competitor, hijack their winning keywords, and generate ready-to-deploy metadata to rank #1 on Google.
        </p>

        <form onSubmit={e => { e.preventDefault(); if (competitorInput.trim()) void compare(competitorInput.trim()); }} className="mt-5 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Enter competitor URL (e.g., https://competitor.com)"
            value={competitorInput}
            onChange={e => setCompetitorInput(e.target.value)}
            className="h-10 flex-1 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-800 outline-none focus:border-violet-500"
          />
          <button type="submit" disabled={busy || !competitorInput.trim()} className="rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50">
            {busy ? "Auditing Head-to-Head…" : "Run Head-to-Head Audit ↗"}
          </button>
        </form>

        {!!data?.discoveredCompetitors?.length && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Discovered Competitors:</span>
            {data.discoveredCompetitors.map(c => (
              <button
                key={c.id}
                onClick={() => { setCompetitorInput(c.url); void compare(c.url); }}
                className="rounded-lg border border-violet-200/60 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 transition"
              >
                {c.domain}
              </button>
            ))}
          </div>
        )}

        {savedKeys.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-violet-100">
            <span className="text-[11px] font-semibold text-slate-500">Saved Audits:</span>
            {savedKeys.map(d => (
              <button
                key={d}
                onClick={() => selectCached(d)}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium transition ${data?.activeCompetitorDomain === d ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {busy && (
        <div role="status" className="rounded-xl border border-violet-200 bg-violet-50/80 p-5 text-xs text-violet-800 animate-pulse">
          <p className="font-bold">Crawling competitor signals & formulating SEO gap diagnosis…</p>
          <p className="mt-1 text-[11px] text-violet-600">Evaluating Title tags, H1/H2 topical clusters, JSON-LD schemas, and keyword targets.</p>
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">{error}</div>}
      {loading && !result && <p className="text-xs text-slate-500 animate-pulse">Loading SEO comparison data…</p>}

      {result && (
        <div className="space-y-6">
          <SeoScorecard client={result.clientProfile} competitor={result.competitorProfile} />
          <SeoDiagnosisCard diagnosis={result.competitiveDisadvantageDiagnosis} opportunityScore={result.organicOpportunityScore} gapFactors={result.gapFactors} />
          <SeoKeywordGapTable keywordGaps={result.keywordGaps} sharedKeywords={result.sharedKeywords} />
          <SeoRecommendationCard
            recommendedTitle={result.recommendedTitle}
            titleRationale={result.recommendedTitleRationale}
            recommendedDescription={result.recommendedDescription}
            descriptionRationale={result.recommendedDescriptionRationale}
            recommendedH1={result.recommendedH1}
            recommendedH2s={result.recommendedH2s}
            primaryKeywords={result.primaryTargetKeywords}
            contentPlan={result.contentInjectionPlan}
          />
          <SeoCopyableSnippet copyable={result.copyableMetadata} />
          <SeoActionPlan steps={result.topActionSteps} />
        </div>
      )}
    </section>
  );
}
