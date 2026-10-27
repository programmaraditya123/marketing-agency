import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import WorkflowSteps from "./components/WorkflowSteps";
import WorkflowFaq from "./components/WorkflowFaq";

const description = "See how Orbit by VidoraHub turns a website into brand research, product insights, target audience hypotheses, competitor landscape, and budget-optimized marketing roadmap.";

export const metadata: Metadata = {
  title: "How It Works",
  description,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `How It Works | ${site.name}`,
    description,
    url: `${site.url}/how-it-works`,
    images: [{ url: site.socialImage, width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", title: `How It Works | ${site.name}`, description, images: [site.socialImage] },
};

export default function HowItWorksPage() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
      <section id="about" className="my-8 rounded-3xl border border-violet-400/20 bg-linear-to-br from-[#080b19] via-[#0c122b] to-[#121133] px-6 py-14 sm:px-12 sm:py-20 shadow-xl">
        <p className="text-xs font-bold tracking-[.2em] text-cyan-300 uppercase">Automated Brand Synthesis</p>
        <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          A website URL goes in.<br />
          <span className="bg-linear-to-r from-cyan-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
            A complete marketing roadmap comes out.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm sm:leading-7">
          Extract verified product claims, audience hypotheses, competitor benchmarks, and 30-day budget allocations in minutes.
        </p>
        <Link href="/analyze" className="mt-8 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 sm:text-sm">
          <span>Start Website Audit</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <WorkflowSteps />
      <WorkflowFaq />

      <section className="mb-16 flex flex-col justify-between gap-6 rounded-3xl border border-violet-100 bg-linear-to-br from-violet-100/90 via-violet-50 to-indigo-50/60 p-8 sm:flex-row sm:items-center sm:p-12 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-violet-950 sm:text-3xl">Ready to audit your brand?</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Enter any public website URL to generate your free evidence-backed dossier.
          </p>
        </div>
        <Link href="/analyze" className="shrink-0 self-start rounded-full bg-violet-700 px-6 py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-600 sm:self-auto sm:text-sm">
          Launch Analysis ↗
        </Link>
      </section>
    </main>
  );
}
