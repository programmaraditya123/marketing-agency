import Link from "next/link";

const capabilities = [
  { title: "Understand the brand", description: "Identify company offerings, value proposition, positioning, and brand voice from crawled evidence.", live: true, symbol: "◎", path: "/analyze" },
  { title: "Find the target audience", description: "Explore audience segments, acute pain points, core desires, and psychological buying triggers.", live: true, symbol: "↗", path: "/analyze" },
  { title: "Discover competitors", description: "AI competitor discovery with domain links, alternative positioning, and 1-click audit.", live: true, symbol: "⇄", path: "/analyze" },
  { title: "Analyze market demand", description: "Track real-world Google search momentum, seasonal spikes, and regional demand patterns.", live: true, symbol: "⌁", path: "/analyze" },
  { title: "Budget & channel plan", description: "Model daily & monthly budgets across highest-ROI marketing channels with 30-day cap arithmetic.", live: true, symbol: "▤", path: "/analyze" },
  { title: "Creative prompts & posters", description: "Turn research insights into high-converting ad copy, visual hooks, and campaign banners.", live: false, symbol: "✧", path: "#" },
];

export default function OrbitCapabilities() {
  return (
    <section id="products" aria-labelledby="capabilities-title" className="scroll-mt-6 py-14 sm:py-20">
      <div className="mb-9 max-w-2xl">
        <p className="text-xs font-bold tracking-[.2em] text-violet-700 uppercase">Strategic Capabilities</p>
        <h2 id="capabilities-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          From website crawl to full campaign roadmap.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Orbit replaces fragmented marketing guesswork with unified, evidence-linked brand intelligence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item, index) => (
          <article key={item.title} id={index === 5 ? "orbit-studio" : undefined} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-700">
                  {item.symbol}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.live ? "bg-cyan-50 text-cyan-900 border border-cyan-100" : "bg-slate-100 text-slate-500"}`}>
                  {item.live ? "Available Now" : "Coming Soon"}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400">0{index + 1}</p>
              <h3 className="mt-1 text-base font-bold text-slate-900 group-hover:text-violet-700">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.description}</p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3">
              {item.live ? (
                <Link href={item.path} className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline">
                  Launch in workspace <span>→</span>
                </Link>
              ) : (
                <span className="text-xs text-slate-400">In active development</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
