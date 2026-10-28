import type { AnalysisJob } from "@/types/analysis";
import Icon from "./WorkspaceIcon";

export default function WorkspaceOverview({ job, onSelect }: { job: AnalysisJob | null; onSelect: (value: string) => void }) {
  const analysis = job?.status === "completed" ? job.analysis : undefined;
  const cards = [
    { title: "SEO Comparison", icon: "seo", tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100", subtitle: "PRIMARY USP", description: "Head-to-head competitor SEO & keyword gap comparison with ready-to-deploy ranking metadata.", count: "Open SEO War Room ↗" },
    { title: "Marketing Plan", icon: "growth", tone: "bg-indigo-50 text-indigo-700 border-indigo-100", subtitle: "BUDGET STRATEGY", description: "Allocate daily & monthly budgets across highest-ROI marketing channels with Gemini 30-day cap modeling.", count: "Build Channel Plan ↗" },
    { title: "Competitor Search", icon: "competitors", tone: "bg-rose-50 text-rose-700 border-rose-100", subtitle: "MARKET INTELLIGENCE", description: "Discover ten direct competitors with verified domain links, positioning comparisons, and 1-click audit.", count: "Identify Competitors ↗" },
    { title: "Market Demand", icon: "analytics", tone: "bg-cyan-50 text-cyan-700 border-cyan-100", subtitle: "SEARCH SIGNALS", description: "Explore real-time Google search trends, regional momentum, and seasonal demand trajectories.", count: "Inspect Demand Signals ↗" },
    { title: "Target Audience", icon: "audience", tone: "bg-violet-50 text-violet-700 border-violet-100", subtitle: "CUSTOMER HYPOTHESES", description: analysis?.targetAudience[0]?.description.value || "Detailed customer personas, pain points, core needs, and high-converting buying triggers.", count: analysis ? `${analysis.targetAudience.length} audience segments` : "Explore Audience ↗" },
    { title: "Content Strategy", icon: "content", tone: "bg-emerald-50 text-emerald-700 border-emerald-100", subtitle: "SOCIAL & POSTING SCHEDULE", description: "AI-formulated platform priorities, content pillars, ready post ideas, and optimal weekly posting times.", count: "View Posting Schedule ↗" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-violet-100 bg-linear-to-br from-[#f5f3ff] via-[#faf5ff] to-[#f0f9ff] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 rounded-full border border-violet-200/50">
          <div className="absolute inset-6 rounded-full border border-violet-200/40" />
          <span className="absolute bottom-6 left-8 h-3.5 w-3.5 rounded-full bg-violet-400/50" />
          <span className="absolute right-10 top-20 h-2.5 w-2.5 rounded-full bg-cyan-400/50" />
        </div>
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[10px] font-semibold text-violet-700 shadow-2xs backdrop-blur-xs">
            ✦ AI Brand Synthesis
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {analysis?.company.name.value || "Strategic Clarity from Website Evidence"}
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {analysis?.company.summary.value || analysis?.positioning.valueProposition.value || "Analyze your website to generate an evidence-backed brand intelligence report, audience hypotheses, competitor landscape, and 30-day marketing plan."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button onClick={() => onSelect(analysis ? "Marketing Plan" : "Your Product")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700">
              {analysis ? "View marketing plan" : "Explore analysis"}
              <Icon name="arrow" className="h-3 w-3" />
            </button>
            <button onClick={() => onSelect("Content Strategy")} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-2 text-xs font-semibold text-violet-700 shadow-2xs transition hover:bg-violet-100">
              Content & schedule
            </button>
            <button onClick={() => onSelect("Competitor Search")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50">
              Competitor search
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pages Analyzed", value: job ? String(job.totalPagesScraped) : "0", icon: "sources" },
          { label: "Products Mapped", value: analysis ? String(analysis.products.length) : "0", icon: "product" },
          { label: "Audience Segments", value: analysis ? String(analysis.targetAudience.length) : "0", icon: "audience" },
          { label: "Growth Opportunities", value: analysis ? String(analysis.marketingOpportunities.length) : "0", icon: "growth" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium text-slate-500">{stat.label}</span>
              <Icon name={stat.icon} className="h-4 w-4 text-violet-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Strategic Intelligence Pillars</h3>
          <span className="text-[10px] font-semibold tracking-wider text-slate-400">CORE MODULES</span>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {cards.map(card => (
            <button key={card.title} onClick={() => onSelect(card.title)} className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex rounded-lg border p-2 text-xs ${card.tone}`}>
                    <Icon name={card.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-slate-400">{card.subtitle}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-violet-700">{card.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">{card.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-violet-600">
                <span>{card.count}</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Deep Dive Navigation</h3>
            <p className="text-[11px] text-slate-500">Jump straight into specific research sections</p>
          </div>
          <button onClick={() => onSelect("Research Sources")} className="text-xs font-semibold text-violet-700 hover:underline">
            View crawled sources ({job?.sources?.length ?? 0}) ↗
          </button>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {["Your Product", "Brand Voice", "Growth Ideas", "Marketing Plan", "Content Strategy"].map(label => (
            <button key={label} onClick={() => onSelect(label)} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-900">
              <span>{label}</span>
              <span className="text-slate-400">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
