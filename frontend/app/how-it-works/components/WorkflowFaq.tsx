const questions = [
  ["What does Orbit analyze today?", "Orbit analyzes accessible website pages to identify the company, products and services, brand positioning, audience hypotheses and marketing opportunities."],
  ["Are target audience insights verified customer data?", "No. Audience insights are research hypotheses based on website evidence. The report labels observations, inferences and unknowns, and provides sources for review."],
  ["Does Orbit read social media posts?", "Orbit discovers social profiles linked from the website. It does not currently analyze posts, followers or engagement."],
  ["Can I research competitors or create images and videos?", "Competitor research, internet trend analysis, image and video prompt generation, and banner and poster creation are coming next. Today, you can use Orbit’s brand brief to prepare that creative work."],
  ["Why are some pages missing from the report?", "Orbit follows website crawl rules and reads up to 8 pages. Login requirements, blocked crawlers, JavaScript-only content and unreachable pages can limit coverage. Check the report’s evidence and limitations."],
];
export default function WorkflowFaq() {
  return <section aria-labelledby="faq-title" className="border-t border-slate-200 py-14"><h2 id="faq-title" className="mb-8 text-3xl font-semibold tracking-tight text-violet-950">A few things to know.</h2><div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 bg-white px-6 py-5"><summary className="cursor-pointer text-sm font-semibold leading-6 text-violet-950">{question}</summary><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></section>;
}
