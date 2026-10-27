import Link from "next/link";

export default function CompetitorCard({
  c,
  idx,
  opening,
  onOpen,
}: {
  c: { id: string; title: string; domain: string; url: string; description: string; analysisId?: string };
  idx: number;
  opening: string;
  onOpen: (id: string) => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs hover:border-violet-200">
      <div>
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="truncate text-sm font-bold text-slate-900">{c.title}</h4>
              {c.analysisId && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Audited
                </span>
              )}
            </div>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-violet-600 hover:underline">
              {c.domain} ↗
            </a>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-3">{c.description}</p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        {c.analysisId ? (
          <Link href={`/analyze?id=${c.analysisId}`} className="block w-full rounded-xl border border-violet-200 bg-violet-50/50 py-2 text-center text-xs font-semibold text-violet-700 transition hover:bg-violet-100">
            Open Competitor Audit ↗
          </Link>
        ) : (
          <button disabled={!!opening} onClick={() => onOpen(c.id)} className="w-full rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 disabled:opacity-50">
            {opening === c.id ? "Launching audit…" : "Deep Audit Competitor ↗"}
          </button>
        )}
      </div>
    </article>
  );
}
