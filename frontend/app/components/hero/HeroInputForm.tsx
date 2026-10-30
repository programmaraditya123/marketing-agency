"use client";
import { useState } from "react";

const SAMPLES = ["stripe.com", "linear.app", "notion.so"];

interface Props {
  onSubmit: (url: string) => Promise<void>;
  busy: boolean;
  error?: string;
}

export default function HeroInputForm({ onSubmit, busy, error }: Props) {
  const [value, setValue] = useState("");

  return (
    <div className="relative z-20 w-full max-w-2xl mx-auto px-4 mt-3 sm:mt-3.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) void onSubmit(value.trim());
        }}
        className="rounded-2xl border border-white/15 bg-[#090b16]/85 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl ring-1 ring-white/10"
      >
        <div className="flex flex-col sm:flex-row items-center gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 w-full">
            <span aria-hidden="true" className="text-sm text-slate-400">🌐</span>
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              required
              maxLength={2048}
              placeholder="Enter your website URL (e.g. stripe.com)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={busy}
              className="h-9 sm:h-10 w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="w-full sm:w-auto shrink-0 flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] hover:shadow-indigo-600/50 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{busy ? "Analyzing..." : "Analyze Website"}</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2 rounded-xl border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-300 backdrop-blur-md">
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span className="text-[10px] text-slate-400">Try a sample:</span>
        {SAMPLES.map((site) => (
          <button
            key={site}
            type="button"
            onClick={() => setValue(site)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            {site}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[10px] text-slate-400">
        <span>✓ 8 Pages Explored</span>
        <span>✓ Source-Verified Citations</span>
        <span>✓ Zero Configuration</span>
      </div>
    </div>
  );
}
