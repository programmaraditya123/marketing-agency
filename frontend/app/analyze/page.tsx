import type { Metadata } from "next";
import Workspace from "./components/Workspace";
import { Suspense } from "react";
export const metadata: Metadata = { title: "Brand workspace", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ id?: string; website?: string }> };
export default function AnalyzePage(props: Props) {
  return <Suspense fallback={<main id="main-content" className="mx-auto max-w-7xl p-10 text-sm text-violet-700">Opening your workspace…</main>}><AnalyzeContent {...props} /></Suspense>;
}
async function AnalyzeContent({ searchParams }: Props) {
  const params = await searchParams;
  const id = typeof params.id === "string" && /^[a-f0-9]{64}$/.test(params.id) ? params.id : undefined;
  const website = typeof params.website === "string" ? params.website.slice(0, 2048) : undefined;
  return <Workspace key={id || website || "new"} initialId={id} initialWebsite={website} />;
}
