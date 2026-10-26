import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import WorkflowSteps from "./components/WorkflowSteps";
import WorkflowFaq from "./components/WorkflowFaq";
const description = "See how Orbit by VidoraHub turns a website into brand research, product insights, target audience hypotheses and an evidence-linked marketing brief.";
export const metadata: Metadata = {
  title: "How It Works", description,
  alternates: { canonical: "/how-it-works" },
  openGraph: { type: "website", siteName: site.name, title: `How It Works | ${site.name}`, description,
    url: `${site.url}/how-it-works`, images: [{ url: site.socialImage, width: 1200, height: 630, alt: site.name }] },
  twitter: { card: "summary_large_image", title: `How It Works | ${site.name}`, description, images: [site.socialImage] },
};
export default function HowItWorksPage() {
  return <main id="main-content" className="mx-auto max-w-7xl px-5 lg:px-10">
    <section id="about" className="my-8 rounded-3xl border border-violet-400/20 bg-[#080b19] px-7 py-14 sm:px-12 sm:py-20"><p className="text-xs font-semibold tracking-[.2em] text-cyan-300">HOW ORBIT WORKS</p><h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">A website goes in.<br /><span className="text-violet-300">A clearer brand brief comes out.</span></h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">Understand the brand. Find the target audience. Use the evidence to plan what comes next.</p><Link href="/#analyze" className="mt-8 inline-flex rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500">Analyze a website ↗</Link></section>
    <WorkflowSteps /><WorkflowFaq />
    <section className="mb-16 flex flex-col justify-between gap-6 rounded-3xl bg-violet-100 p-8 sm:flex-row sm:items-center sm:p-12"><div><h2 className="text-2xl font-semibold tracking-tight text-violet-950">Start with the brand.</h2><p className="mt-2 text-sm leading-7 text-slate-600">Enter a website and let Orbit organize the research.</p></div><Link href="/#analyze" className="shrink-0 self-start rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 sm:self-auto">Start your analysis ↗</Link></section>
  </main>;
}
