import type { ReactNode } from "react";
export default function ReportSection({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h3 className="mb-5 text-xl font-semibold tracking-tight text-violet-950">{title}</h3>{note && <p className="mb-5 text-sm leading-6 text-slate-500">{note}</p>}{children}</section>;
}
export function DetailList({ title, values }: { title: string; values: string[] }) {
  return <div><h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>{values.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-slate-700">{values.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Not enough website evidence yet.</p>}</div>;
}
