interface Props {
  type: "seo" | "content" | "competitor" | "trends" | "budget" | "dossier";
}

export default function HeroCardContent({ type }: Props) {
  if (type === "seo") {
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-violet-500/30 bg-violet-950/30 p-2">
            <span className="text-[8px] font-bold text-violet-300 uppercase">Your Website</span>
            <div className="flex items-baseline justify-between"><span className="text-lg font-black text-white">92</span><span className="text-[8px] font-semibold text-emerald-400">SEO Health</span></div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
            <span className="text-[8px] font-bold text-slate-400 uppercase">Competitor</span>
            <div className="flex items-baseline justify-between"><span className="text-lg font-black text-slate-300">64</span><span className="text-[8px] font-semibold text-amber-400">Needs Work</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2">
          <div className="flex items-center justify-between text-[9px]"><span className="font-bold text-emerald-300">Keyword Gap Matrix</span><span className="rounded bg-emerald-500/20 px-1 text-emerald-300 font-bold">+48% Upside</span></div>
          <p className="mt-0.5 text-[10px] font-medium text-slate-200 truncate">marketing intelligence platform</p>
          <p className="text-[8px] text-slate-400 truncate">Competitor ranks #1 · Deploy H1 & Schema</p>
        </div>
      </div>
    );
  }

  if (type === "content") {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between"><span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-bold text-cyan-300">Goal: Lead Gen</span><span className="text-[9px] text-slate-400">7-Day Engine</span></div>
        <div className="flex gap-1 text-[8px] font-semibold text-slate-300"><span className="rounded bg-white/10 px-1.5 py-0.5">LinkedIn 3x</span><span className="rounded bg-white/10 px-1.5 py-0.5">X 5x</span><span className="rounded bg-white/10 px-1.5 py-0.5">IG Daily</span></div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
          <div className="flex items-center justify-between text-[9px] text-violet-300 font-bold"><span>Day 3 · LinkedIn 09:30 AM</span><span className="text-slate-400">Carousel</span></div>
          <p className="mt-0.5 text-[10px] font-medium text-white line-clamp-2">"90% of brands waste $5k on ads before fixing this one page..."</p>
          <span className="mt-0.5 inline-block text-[8px] text-cyan-300">CTA: Drop &apos;ORBIT&apos; in comments →</span>
        </div>
      </div>
    );
  }

  if (type === "competitor") {
    return (
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-[9px] text-slate-400"><span>10 Discovered Rivals</span><span className="text-emerald-400 font-bold">● Active Scan</span></div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
          <div className="flex items-center justify-between"><span className="font-bold text-white text-[11px]">kukunotes.com</span><span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[8px] font-bold text-emerald-300">Audited</span></div>
          <p className="mt-0.5 text-[9px] text-slate-400 line-clamp-2">AI meeting assistant & notes. Premium pricing tier gap identified.</p>
        </div>
        <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 p-1.5 text-center"><span className="text-[9px] font-bold text-violet-300">1-Click: Compare SEO & Keywords ↗</span></div>
      </div>
    );
  }

  if (type === "trends") {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between"><span className="font-bold text-white text-[11px]">AI Meeting Assistant</span><span className="text-[9px] text-cyan-300 font-semibold">+38% YoY</span></div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
          <div className="flex justify-between text-[8px] text-slate-400"><span>52-Wk Search Trajectory</span><span className="text-emerald-400 font-bold">84 / 100 avg</span></div>
          <svg viewBox="0 0 100 24" className="mt-1 h-6 w-full stroke-cyan-400 fill-none" strokeWidth={2.5}><path d="M0 20 Q20 18, 40 10 T80 5 T100 2" /></svg>
        </div>
        <div className="text-[8px] text-slate-400">Strategic: Rising seasonal peak in Q4</div>
      </div>
    );
  }

  if (type === "budget") {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between"><span className="font-bold text-white text-[11px]">$3,000 / mo Cap</span><span className="text-[9px] text-emerald-400 font-semibold">$100 / day</span></div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="bg-violet-500 w-[45%]" /><div className="bg-cyan-400 w-[35%]" /><div className="bg-emerald-400 w-[20%]" /></div>
        <div className="space-y-0.5 text-[9px]"><div className="flex justify-between text-slate-300"><span>Google Ads (Paid)</span><span className="font-bold text-white">$1,350 (45%)</span></div><div className="flex justify-between text-slate-300"><span>SEO & Content (Organic)</span><span className="font-bold text-white">$1,050 (35%)</span></div><div className="flex justify-between text-slate-300"><span>Lifecycle Email (Owned)</span><span className="font-bold text-white">$600 (20%)</span></div></div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between text-[9px]"><span className="font-bold text-white">orbit.vidorahub.com</span><span className="rounded bg-emerald-500/20 px-1 text-emerald-300 font-bold">8 Pages Indexed</span></div>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 space-y-1"><span className="text-[8px] font-bold text-violet-300 uppercase">Target Persona</span><p className="text-[10px] font-medium text-slate-200">Growth founders & agency teams seeking positioning clarity.</p></div>
      <div className="text-[8px] text-cyan-300 font-semibold">✓ 100% Crawled Evidence Backed</div>
    </div>
  );
}
