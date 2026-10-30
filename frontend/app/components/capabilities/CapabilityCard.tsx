import Link from "next/link";
import type { CapabilityItem } from "./capabilitiesData";

interface Props {
  item: CapabilityItem;
  index: number;
  assembled: boolean;
}

export default function CapabilityCard({ item, index, assembled }: Props) {
  return (
    <article
      style={{ transitionDelay: `${index * 85}ms` }}
      className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a0d22]/95 to-[#070918]/95 p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl ring-1 ring-white/10 select-none before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent transition-all duration-700 ease-out group hover:-translate-y-2 hover:border-violet-400/30 hover:shadow-2xl hover:shadow-violet-950/40 ${
        assembled ? "translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100" : item.scatterClass
      }`}
    >
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br ${item.accent} text-lg font-bold shadow-md`}
          >
            {item.symbol}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
            {item.badge}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            {item.metric}
          </p>
          <h3 className="mt-1.5 text-base sm:text-lg font-bold text-white tracking-tight transition-colors group-hover:text-cyan-300">
            {item.title}
          </h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-3">
        <Link
          href={item.path}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 transition-colors group-hover:text-cyan-300"
        >
          <span>Launch in workspace</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </article>
  );
}
