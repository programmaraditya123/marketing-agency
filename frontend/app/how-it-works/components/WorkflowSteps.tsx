const steps = [
  { title: "Enter the website URL", text: "Paste a public website into Orbit. You can enter a full URL or a domain name.", detail: "Start with the brand’s main website. Pages behind a login are not included." },
  { title: "Orbit reads the website", text: "Orbit explores up to 8 pages, including accessible product, service, about and pricing pages. It also finds social links published on those pages.", detail: "Some websites block crawlers or need JavaScript to show their content. Your report explains gaps in the research." },
  { title: "Get the brand and audience analysis", text: "Review the company, products, brand positioning and likely target audiences. Explore audience needs, buying triggers, content themes and marketing opportunities.", detail: "Observed facts include source links. Inferences and unknown information are labeled so you can review them with your client." },
  { title: "Use the research", text: "Use the report to shape your brief, ask better client questions and plan your next campaign. Download the structured report as JSON when you need it.", detail: "Competitor research, internet trend analysis, image and video prompts, and banner and poster creation are planned next." },
];
export default function WorkflowSteps() {
  return <section aria-labelledby="workflow-title" className="py-14 sm:py-20"><h2 id="workflow-title" className="mb-8 text-3xl font-semibold tracking-tight text-violet-950">From website to brand brief.</h2>
    <ol className="grid gap-5 md:grid-cols-2">{steps.map((step, index) => <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-7"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-800">0{index + 1}</span><h3 className="mt-6 text-xl font-semibold text-violet-950">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p><p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500">{step.detail}</p></li>)}</ol>
  </section>;
}
