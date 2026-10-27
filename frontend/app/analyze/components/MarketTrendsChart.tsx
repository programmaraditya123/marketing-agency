import type { TrendData } from "@/types/market";

export default function MarketTrendsChart({ raw, colors }: { raw: TrendData; colors: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900">Search Interest Over Time</h3>
        <span className="text-[11px] text-slate-500">{raw.config.geo || "Worldwide"} · Normalized Scale 0–100</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {raw.metrics?.map(metric => (
          <div key={metric.term} className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <p className="text-xs font-bold text-violet-900">{metric.term}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {metric.recentMean}
              <span className="text-xs font-normal text-slate-500"> / 100 avg</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              {metric.nonZeroPeriods === 0
                ? "Insufficient search volume"
                : metric.changePercent === null
                ? "Stable baseline"
                : `${metric.changePercent > 0 ? "+" : ""}${metric.changePercent}% vs earlier period`}
            </p>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 600 180" role="img" aria-label="Search interest timeline chart" className="mt-5 w-full overflow-visible">
        <path d="M20 10V160H590" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
        {[0, 50, 100].map(v => (
          <text key={v} x="0" y={164 - v * 1.5} fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
            {v}
          </text>
        ))}
        {raw.config.terms.map((term, idx) => (
          <polyline
            key={term}
            fill="none"
            stroke={colors[idx % colors.length]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={raw.timeline
              .map(
                (point, i) =>
                  `${20 + (i * 570) / Math.max(1, raw.timeline.length - 1)},${
                    160 - (point.values[term] || 0) * 1.5
                  }`
              )
              .join(" ")}
          />
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        {raw.config.terms.map((term, i) => (
          <span key={term} className="flex items-center gap-1.5 font-medium" style={{ color: colors[i % colors.length] }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            {term}
          </span>
        ))}
      </div>

      <details className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold hover:text-violet-700">View collected period breakdown</summary>
        <div className="mt-3 max-h-56 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th>Period</th>
                {raw.config.terms.map(t => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raw.timeline.map(p => (
                <tr key={p.date} className="border-b border-slate-50">
                  <td className="py-1 text-slate-500">{p.date.slice(0, 10)}</td>
                  {raw.config.terms.map(t => (
                    <td key={t} className="font-medium">
                      {p.values[t]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
