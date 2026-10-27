const questions = [
  [
    "What does Orbit analyze today?",
    "Orbit crawls up to 8 accessible pages to map brand positioning, value propositions, product offerings, audience hypotheses, competitor alternatives, Google Trends demand signals, and 30-day channel budgets.",
  ],
  [
    "Are target audience insights verified customer analytics?",
    "Audience segments are research hypotheses synthesized from publicly observed website evidence. Orbit labels observed facts with source links, and marks inferences so you know what to validate directly with customer interviews.",
  ],
  [
    "How does Orbit calculate the 30-day marketing plan?",
    "Using your daily and monthly budgets and currency, Orbit calculates an effective 30-day cap using minor-unit arithmetic to prevent overspending. Gemini recommends channel splits, action steps, and metrics based on your product and demand data.",
  ],
  [
    "Can I research competitors and Google Trends?",
    "Yes! Competitor discovery (with 1-click deep audits) and Google Trends search momentum signals are fully live in your workspace today. Creative tools for ad prompts and banner generation are planned next in Orbit Studio.",
  ],
  [
    "Why are some pages missing from the report?",
    "Orbit respects robots.txt directives and explores up to 8 pages per website. Pages behind auth/logins, heavily dynamic single-page applications without server HTML, or blocked crawlers may be skipped. These notes are recorded in your evidence summary.",
  ],
];

export default function WorkflowFaq() {
  return (
    <section aria-labelledby="faq-title" className="border-t border-slate-200/80 py-14">
      <h2 id="faq-title" className="mb-8 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {questions.map(([question, answer]) => (
          <details key={question} className="group rounded-2xl border border-slate-200/90 bg-white px-6 py-4.5 shadow-2xs transition hover:border-violet-200">
            <summary className="cursor-pointer text-sm font-bold text-slate-900 group-open:text-violet-700">
              {question}
            </summary>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
