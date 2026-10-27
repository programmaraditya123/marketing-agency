import Image from "next/image";

export default function ResearchPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden="true" className="absolute inset-4 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-[#080d24]/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Image src="/brand/orbit-logo.webp" alt="Orbit logo" width={32} height={32} className="rounded-lg" />
            <div>
              <p className="text-xs font-bold text-white">Orbit Dossier Preview</p>
              <p className="text-[10px] text-cyan-300">Automated Brand Audit</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Verified
          </span>
        </div>

        <div className="mt-4 space-y-2.5 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Target Audience Persona</p>
            <p className="mt-1 font-medium text-slate-200">High-growth founders & marketing agency teams seeking rapid positioning clarity.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Market Demand</p>
              <p className="mt-1 text-lg font-bold text-white">+38% <span className="text-[10px] font-normal text-slate-400">YoY Search</span></p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">30-Day Budget</p>
              <p className="mt-1 text-lg font-bold text-white">4 Channels <span className="text-[10px] font-normal text-slate-400">Capped</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Evidence Crawl Depth</span>
              <span className="font-semibold text-cyan-300">8 Pages Explored</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 rounded-full bg-linear-to-r from-cyan-400 to-violet-500 w-[92%]" />
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>Observed facts with source links</span>
          <span className="text-violet-300">Gemini 3-step synthesis →</span>
        </div>
      </div>
    </div>
  );
}
