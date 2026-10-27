import type { Finding } from "@/types/analysis";

export function safeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function FindingView({ finding, label }: { finding: Finding; label?: string }) {
  const isObserved = finding.basis === "observed";
  const badgeTone = isObserved
    ? "bg-violet-50 text-violet-800 border-violet-100"
    : finding.basis === "inferred"
    ? "bg-cyan-50 text-cyan-800 border-cyan-100"
    : "bg-amber-50 text-amber-800 border-amber-100";

  return (
    <div className="space-y-2">
      {label && <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</h4>}
      <p className="break-words text-sm leading-relaxed text-slate-800 sm:text-base">{finding.value}</p>
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium ${badgeTone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isObserved ? "bg-violet-600" : "bg-cyan-500"}`} />
          {finding.basis} · {finding.confidence} confidence
        </span>
        {finding.evidenceUrls?.map((url, i) => {
          const valid = safeWebUrl(url);
          return valid ? (
            <a key={url} href={valid} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-medium text-violet-700 shadow-2xs transition hover:bg-violet-50 hover:border-violet-300">
              Source {i + 1} ↗
            </a>
          ) : null;
        })}
      </div>
    </div>
  );
}
