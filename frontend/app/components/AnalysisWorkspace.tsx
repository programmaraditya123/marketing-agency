"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WebsiteForm from "./WebsiteForm";
import ResearchPreview from "./ResearchPreview";

export default function AnalysisWorkspace() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(value: string) {
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Please enter a valid HTTP or HTTPS website URL.");
      router.push(`/analyze?website=${encodeURIComponent(url.href)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enter a valid website address.");
    }
  }

  return (
    <section id="analyze" className="my-8 grid scroll-mt-6 items-center gap-10 overflow-hidden rounded-3xl border border-violet-400/20 bg-linear-to-br from-[#080b19] via-[#0b102b] to-[#12133a] px-6 py-12 shadow-2xl sm:px-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12 lg:px-12 lg:py-16">
      <div>
        <p className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-[.2em] text-cyan-300 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
          ORBIT BY VIDORAHUB · AI BRAND AGENCY
        </p>
        <h1 className="text-3xl font-bold leading-[1.08] tracking-[-.04em] text-white sm:text-5xl xl:text-6xl">
          Understand the brand.<br />
          <span className="bg-linear-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Plan your next move.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm sm:leading-7">
          Extract verified product claims, audience personas, competitor landscape, Google Trends momentum, and custom 30-day marketing plans from any public website.
        </p>
        <p className="mt-2 text-[11px] text-cyan-300/80">
          ✓ Brand Audit · ✓ Target Audience · ✓ Competitor Intelligence · ✓ Google Trends · ✓ Channel Budgets
        </p>

        <WebsiteForm onSubmit={submit} busy={false} />

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
          <span>✓ Up to 8 pages crawled</span>
          <span>✓ Source-verified citations</span>
          <span>✓ Free guest analysis</span>
        </div>
      </div>

      <ResearchPreview />
    </section>
  );
}
