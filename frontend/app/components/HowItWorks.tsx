import Link from "next/link";

const steps = [
  ["01", "Enter Website Link", "Submit any public website or domain. Orbit automatically maps and crawls up to 8 core pages."],
  ["02", "AI Evidence Synthesis", "Gemini connects evidence points into positioning, audience hypotheses, competitor landscape, and demand."],
  ["03", "Actionable 30-Day Roadmap", "Receive channel allocations, daily pacing limits, success metrics, and structured briefs ready to execute."],
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-200/80 py-16 sm:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.2em] text-violet-700 uppercase">Automated Intelligence Workflow</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            From raw website to complete strategy.
          </h2>
        </div>
        <Link href="/how-it-works" className="text-xs font-semibold text-violet-700 hover:underline sm:text-sm">
          Inspect full methodology ↗
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map(([n, title, text]) => (
          <article key={n} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-violet-200">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">
              {n}
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm sm:leading-6">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
