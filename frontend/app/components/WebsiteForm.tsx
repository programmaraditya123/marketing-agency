"use client";
import { useState } from "react";

const sampleWebsites = ["stripe.com", "linear.app", "notion.so"];

export default function WebsiteForm({ onSubmit, busy }: { onSubmit: (url: string) => Promise<void>; busy: boolean }) {
  const [value, setValue] = useState("");

  return (
    <form onSubmit={e => { e.preventDefault(); void onSubmit(value.trim()); }} className="mt-7">
      <label htmlFor="website" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
        Enter a public brand or product website
      </label>
      <div className="flex flex-col gap-2 rounded-2xl border border-white/25 bg-white p-2 shadow-lg shadow-violet-950/20 focus-within:ring-2 focus-within:ring-cyan-400 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <span aria-hidden="true" className="text-lg text-slate-400">🌐</span>
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            autoComplete="url"
            required
            maxLength={2048}
            placeholder="e.g. yourbrand.com or https://company.io"
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={busy}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
          />
        </div>
        <button
          disabled={busy}
          className="flex min-h-11 items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60"
        >
          {busy ? "Analyzing…" : "Analyze Website"}
          <span aria-hidden="true" className="ml-1.5">↗</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Try a sample:</span>
        {sampleWebsites.map(site => (
          <button
            key={site}
            type="button"
            onClick={() => setValue(site)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 transition hover:bg-white/15 hover:text-white"
          >
            {site}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        Crawls up to 8 accessible pages and generates source-verified audience, competitor, and marketing intelligence.
      </p>
    </form>
  );
}
