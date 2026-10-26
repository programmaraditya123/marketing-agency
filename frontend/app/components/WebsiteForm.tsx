"use client";
import { useState } from "react";
export default function WebsiteForm({ onSubmit, busy }: { onSubmit: (url: string) => Promise<void>; busy: boolean }) {
  const [value, setValue] = useState("");
  return <form onSubmit={event => { event.preventDefault(); void onSubmit(value.trim()); }} className="mt-8">
    <label htmlFor="website" className="mb-2 block text-sm font-medium text-white">Enter your website URL</label>
    <div className="flex flex-col gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-cyan-400 sm:flex-row">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><span aria-hidden="true" className="text-xl text-slate-400">◎</span><input id="website" name="website" type="text" inputMode="url" autoComplete="url" required maxLength={2048} placeholder="example.com" value={value} onChange={e => setValue(e.target.value)} disabled={busy} className="h-12 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" /></div>
      <button disabled={busy} className="min-h-12 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60">{busy ? "Analyzing…" : "Analyze Website"} <span aria-hidden="true" className="ml-2">↗</span></button>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-400">Use a public website. Orbit explores up to 8 pages and creates a research report with source links.</p>
  </form>;
}
