import { safeWebUrl } from "../FindingView";
export default function SourceLinks({ urls }: { urls: string[] }) {
  return <div className="flex flex-wrap gap-2">{urls.map((url, index) => safeWebUrl(url) && <a key={url} href={safeWebUrl(url)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100">Source {index + 1} ↗</a>)}</div>;
}
