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
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Enter an HTTP or HTTPS website URL.");
      router.push(`/analyze?website=${encodeURIComponent(url.href)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enter a valid website."); }
  }
  return <>
    <section id="analyze" className="my-8 grid scroll-mt-6 items-center gap-10 overflow-hidden rounded-3xl border border-violet-400/20 bg-[#080b19] px-6 py-12 shadow-xl shadow-violet-950/10 sm:px-10 lg:grid-cols-[1.3fr_1fr] lg:gap-10 lg:px-12 lg:py-16">
      <div><p className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-[.18em] text-cyan-300"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> ORBIT BY VIDORAHUB</p>
        <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-.05em] text-white sm:text-5xl xl:text-6xl">Understand the brand.<br /><span className="bg-linear-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">Find the target audience.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">Find your competitors. Analyze internet trends. Create prompts for image and video generation. Create your banners and posters.</p>
        <p className="mt-3 max-w-xl text-xs leading-6 text-slate-400">Brand and audience analysis is available now. Competitor research, trend analysis and creative tools are coming next.</p>
        <WebsiteForm onSubmit={submit} busy={false} />
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400"><span>✓ Company & products</span><span>✓ Audience insights</span><span>✓ Marketing opportunities</span></div>
      </div><ResearchPreview />
    </section>
  </>;
}
