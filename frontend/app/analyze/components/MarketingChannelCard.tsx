import type { MarketingChannel, MarketingBudget } from "@/types/marketing";

const approachColors: Record<string, string> = {
  paid: "bg-violet-100 text-violet-800 border-violet-200",
  organic: "bg-emerald-100 text-emerald-800 border-emerald-200",
  owned: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export default function MarketingChannelCard({
  channel,
  index,
  currency,
  money,
}: {
  channel: MarketingChannel;
  index: number;
  currency: MarketingBudget["currency"];
  money: (amount: number, code?: MarketingBudget["currency"]) => string;
}) {
  const badgeClass = approachColors[channel.approach] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-slate-400">CHANNEL {index + 1}</span>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                {channel.approach}
              </span>
            </div>
            <h4 className="mt-1.5 text-base font-bold text-slate-900">{channel.name}</h4>
          </div>
          <div className="rounded-xl bg-violet-50 px-3 py-1.5 text-right border border-violet-100">
            <span className="text-base font-bold text-violet-700">{channel.allocationPercent}%</span>
            <span className="block text-[9px] font-medium text-violet-500">of budget</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400">Daily Allocation</span>
            <span className="mt-0.5 block font-bold text-slate-800">{money(channel.dailyAllocation, currency)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Monthly Allocation</span>
            <span className="mt-0.5 block font-bold text-slate-800">{money(channel.monthlyAllocation, currency)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-xs leading-relaxed">
          <div>
            <span className="font-bold text-slate-700">Why it fits: </span>
            <span className="text-slate-600">{channel.why}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">When to activate: </span>
            <span className="text-slate-600">{channel.when}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Success Metric</span>
              <span className="mt-1 block text-slate-700">{channel.successMetric}</span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Scale or Stop</span>
              <span className="mt-1 block text-slate-700">{channel.scaleOrStop}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <h5 className="text-[11px] font-bold text-slate-800">Action Plan (First Steps)</h5>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {channel.firstSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-violet-500 font-bold">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
