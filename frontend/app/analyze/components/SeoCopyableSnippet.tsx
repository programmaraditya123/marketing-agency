"use client";
import { useState } from "react";
import type { CopyableMetadata } from "../types/seo";

export default function SeoCopyableSnippet({ copyable }: { copyable: CopyableMetadata }) {
  const [activeTab, setActiveTab] = useState<"html" | "jsonld" | "nextjs">("html");
  const [copied, setCopied] = useState(false);

  const code = activeTab === "html" ? copyable.htmlMetaTags
    : activeTab === "jsonld" ? copyable.jsonLdSchema
    : copyable.nextJsMetadata;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <section aria-label="Copyable SEO Metadata" className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 shadow-sm space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Ready-to-Deploy Code Snippets</h3>
          <p className="text-[11px] text-slate-400">Copy and paste these optimized tags directly into your codebase to rank higher</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("html")}
              className={`rounded-md px-2.5 py-1 transition ${activeTab === "html" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              HTML &lt;head&gt;
            </button>
            <button
              onClick={() => setActiveTab("jsonld")}
              className={`rounded-md px-2.5 py-1 transition ${activeTab === "jsonld" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Schema JSON-LD
            </button>
            <button
              onClick={() => setActiveTab("nextjs")}
              className={`rounded-md px-2.5 py-1 transition ${activeTab === "nextjs" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Next.js Metadata
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
          >
            <span>{copied ? "✓ Copied!" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <pre className="max-h-56 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] font-mono leading-relaxed text-emerald-400 select-all">
          {code}
        </pre>
      </div>
    </section>
  );
}
