import type { Metadata } from "next";
import AuthForm from "./components/AuthForm";
import { Suspense } from "react";
export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ mode?: string }> };
export default function AuthPage(props: Props) {
  return <Suspense fallback={<main id="main-content" className="mx-auto max-w-5xl p-10 text-sm text-violet-700">Opening your account…</main>}><AuthContent {...props} /></Suspense>;
}
async function AuthContent({ searchParams }: Props) {
  const { mode } = await searchParams;
  return <main id="main-content" className="mx-auto max-w-5xl px-5 py-12 sm:py-20"><AuthForm initialMode={mode === "register" ? "register" : "login"} /></main>;
}
