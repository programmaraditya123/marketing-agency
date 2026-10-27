const steps = [
  {
    title: "Enter the website URL",
    text: "Provide a public brand website URL or domain name. Orbit accepts any HTTP or HTTPS link.",
    detail: "Start with the main domain. Orbit navigates the publicly accessible landing, product, and pricing pages.",
  },
  {
    title: "Orbit crawls & extracts evidence",
    text: "Orbit explores up to 8 key pages, extracting positioning statements, feature benefits, pricing, and social channels.",
    detail: "Every extracted fact is linked to its source page so you and your team can verify claims.",
  },
  {
    title: "AI synthesizes brand & audience",
    text: "Gemini maps value propositions, builds persona hypotheses, identifies buying triggers, and surfaces high-ROI growth angles.",
    detail: "Facts are clearly labeled as observed, inferred, or unknown to distinguish evidence from hypotheses.",
  },
  {
    title: "Explore market, competitors & budget",
    text: "Launch 1-click competitor audits, measure real-world Google search momentum, and calculate 30-day channel budget caps.",
    detail: "Export structured JSON reports or refine your founder brief directly in your workspace.",
  },
];

export default function WorkflowSteps() {
  return (
    <section aria-labelledby="workflow-title" className="py-14 sm:py-20">
      <h2 id="workflow-title" className="mb-8 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        From website link to complete brand intelligence.
      </h2>
      <ol className="grid gap-5 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-2xs">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-800">
              0{index + 1}
            </span>
            <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{step.text}</p>
            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
