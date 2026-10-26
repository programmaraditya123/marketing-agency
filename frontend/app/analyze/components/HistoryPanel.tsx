"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getActivity, getHistory, type ActivityItem, type HistoryItem } from "../api/workspace";
import { useAuth } from "@/components/auth/AuthProvider";
export default function HistoryPanel({ activity }: { activity: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const scope = user ? "user" : "guest";
  const [items, setItems] = useState<(HistoryItem | ActivityItem)[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    if (authLoading) return;
    let live = true;
    (activity ? getActivity() : getHistory(undefined, scope)).then(page => { if (live) { setItems(page.items); setCursor(page.nextCursor); } })
      .catch(cause => { if (live) setError(cause instanceof Error ? cause.message : "Could not load history."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [activity, scope, authLoading]);
  async function more() {
    if (!cursor) return;
    setLoading(true); setError("");
    try { const page = activity ? await getActivity(cursor) : await getHistory(cursor, scope); setItems(previous => [...previous, ...page.items]); setCursor(page.nextCursor); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load more."); }
    finally { setLoading(false); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="mb-6"><h2 className="text-lg font-semibold text-slate-900">{activity ? "The steps along the way." : "Websites analyzed"}</h2><p className="mt-2 text-xs leading-6 text-slate-500">{activity ? "Your searches, viewed sections, account sessions, and saved briefs. Retained for 90 days." : user ? "Your account history includes website research linked from your guest visits and other signed-in devices." : "Your website research is saved to this browser visitor. Sign in to link it to your account."}</p></div>
    {error && <p role="alert" className="mb-4 text-xs text-red-700">{error} <button className="underline" onClick={() => window.location.reload()}>Retry</button></p>}
    {!loading && !error && !items.length && <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{activity ? "Your workspace activity will appear here." : "No searches yet. Analyze your first website above."}</div>}
    <div className="divide-y divide-slate-100">{items.map((item, index) => { const isSearch = "startUrl" in item; const id = isSearch ? item.id : item.analysisId;
      return <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-all text-sm font-medium text-slate-700">{isSearch ? `${index + 1}. ${item.website || item.startUrl}` : item.detail}</p><p className="mt-2 text-[10px] text-slate-400">{isSearch ? `${item.type === "competitor" ? "Competitor analysis" : "Website analysis"} - ${item.status}` : item.type.replaceAll("_", " ")} · {new Date(item.createdAt).toLocaleString()}</p></div>{id && <Link href={`/analyze?id=${id}`} className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-[11px] font-medium text-violet-700 hover:bg-violet-100">Open report ↗</Link>}</div>;
    })}</div>{loading && <p role="status" className="py-5 text-xs text-violet-600">Loading your history…</p>}{cursor && <button disabled={loading} onClick={() => void more()} className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 disabled:opacity-50">Load more</button>}
  </section>;
}
