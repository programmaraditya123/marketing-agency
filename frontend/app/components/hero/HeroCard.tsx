import HeroCardContent from "./HeroCardContent";

export interface HeroCardData {
  title: string;
  subtitle: string;
  rating: string;
  breadcrumb: string;
  accentGlow: string;
  visualType: "seo" | "content" | "competitor" | "trends" | "budget" | "dossier";
}

export default function HeroCard({ card }: { card: HeroCardData }) {
  return (
    <div className="relative flex h-[245px] sm:h-[260px] w-60 sm:w-64 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d20]/95 p-3 sm:p-3.5 shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10 select-none before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">
      {/* Ambient Radial Accent Glow */}
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-25 ${card.accentGlow}`} />

      {/* Top Window Bar matching /analyze workspace */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 z-10">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[120px]">
            {card.breadcrumb}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-1.5 py-0.2 text-[8px] font-bold text-amber-300">
          <span>{card.rating}</span>
          <span className="text-amber-400">★</span>
        </div>
      </div>

      {/* Actual Miniature UI Glimpse */}
      <div className="z-10 my-auto py-1">
        <HeroCardContent type={card.visualType} />
      </div>

      {/* Bottom Label Row */}
      <div className="z-10 border-t border-white/10 pt-1.5 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-bold text-white tracking-tight">
            {card.title}
          </h3>
          <p className="text-[8px] font-semibold tracking-wider text-cyan-300 uppercase">
            {card.subtitle}
          </p>
        </div>
        <span className="text-[9px] text-slate-500 font-semibold">Live ↗</span>
      </div>
    </div>
  );
}
