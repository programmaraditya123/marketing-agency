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
    try {
      const page = activity ? await getActivity(cursor) : await getHistory(cursor, scope);
      setItems(prev => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load additional items.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{activity ? "Audit Trail & Activity Log" : "Analyzed Website Dossiers"}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {activity
            ? "Timestamped log of searches, section views, briefs, and auth sessions (90-day retention)."
            : user
            ? "All website audits associated with your account across all active sessions."
            : "Audits saved to your local visitor profile. Sign in to link them permanently."}
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          {error} <button className="ml-2 font-semibold underline" onClick={() => window.location.reload()}>Retry</button>
        </p>
      )}

      {!loading && !error && !items.length && (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-xs text-slate-400">
          {activity ? "Your activity will be logged here as you navigate your workspace." : "No analyzed websites yet. Enter a URL above to run your first audit."}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {items.map((item, index) => {
          const isSearch = "startUrl" in item;
          const id = isSearch ? item.id : item.analysisId;
          return (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{String(index + 1).padStart(2, "0")}.</span>
                  <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                    {isSearch ? (item.website || item.startUrl).replace(/^https?:\/\/(www\.)?/, "") : item.detail}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isSearch ? `${item.type === "competitor" ? "Competitor Audit" : "Website Audit"} · ${item.status}` : item.type.replaceAll("_", " ")} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {id && (
                <Link href={`/analyze?id=${id}`} className="rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-2xs transition hover:bg-violet-100">
                  Open Dossier ↗
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {loading && <p role="status" className="py-4 text-center text-xs text-violet-600 animate-pulse">Loading items…</p>}
      {cursor && (
        <button disabled={loading} onClick={() => void more()} className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50">
          Load more items
        </button>
      )}
    </section>
  );
}
