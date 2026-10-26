import Link from "next/link";
export default function HowItWorks() {
  const steps = [
    ["01", "Start with a link", "Share your client’s website. We explore their homepage and key product, about and pricing pages."],
    ["02", "Connect the dots", "AI turns website evidence into a clear picture of the business, its offer and likely audience."],
    ["03", "Find your next move", "Get a structured brand brief, source links and practical opportunities to guide your marketing."],
  ];
  return <section id="how-it-works" className="border-t border-slate-200 py-16">
    <div className="mb-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[.2em] text-violet-700">HOW ORBIT WORKS</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-violet-950">Enter a URL. Get a brand brief.</h2></div><Link href="/how-it-works" className="text-sm font-medium text-violet-700 underline underline-offset-4">See the full process ↗</Link></div>
    <div className="grid gap-8 md:grid-cols-3">{steps.map(([n, title, text]) => <article key={n} className="border-t border-slate-300 pt-5"><span className="text-sm font-medium text-cyan-700">{n} /</span><h3 className="mt-5 text-lg font-semibold text-violet-950">{title}</h3><p className="mt-2 max-w-sm text-sm leading-7 text-slate-600">{text}</p></article>)}</div>
  </section>;
}
