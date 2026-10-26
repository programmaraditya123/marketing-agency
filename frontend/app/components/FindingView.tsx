import type { Finding } from "@/types/analysis";
export function safeWebUrl(value: string): string | undefined {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export default function FindingView({ finding, label }: { finding: Finding; label?: string }) {
  return <div className="space-y-2">{label && <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</h4>}
    <p className="break-words text-base leading-8 text-slate-700">{finding.value}</p>
    <div className="flex flex-wrap items-center gap-2 text-[11px]"><span className={`rounded-full px-2 py-1 ${finding.basis === "observed" ? "bg-violet-50 text-violet-800" : "bg-amber-50 text-amber-900"}`}>{finding.basis} · {finding.confidence} confidence</span>
      {finding.evidenceUrls.map((url, i) => safeWebUrl(url) && <a key={url} href={safeWebUrl(url)} target="_blank" rel="noopener noreferrer" className="text-violet-800 underline underline-offset-2">Source {i + 1} ↗</a>)}
    </div>
  </div>;
}
