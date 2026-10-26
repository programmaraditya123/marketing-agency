const capabilities = [
  { title: "Understand the brand", description: "Identify the company, products, services, positioning and brand voice.", live: true, symbol: "◎" },
  { title: "Find the target audience", description: "Explore likely audience segments, needs, pain points and buying triggers.", live: true, symbol: "↗" },
  { title: "Find your competitors", description: "Compare competing brands, their offers and the gaps you can address.", live: false, symbol: "⇄" },
  { title: "Analyze internet trends", description: "Track relevant conversations and emerging topics for your campaigns.", live: false, symbol: "⌁" },
  { title: "Create image & video prompts", description: "Turn a creative direction into prompts for image and video generation.", live: false, symbol: "✧" },
  { title: "Create banners & posters", description: "Bring your campaign ideas into branded banners and posters.", live: false, symbol: "▧" },
];
export default function OrbitCapabilities() {
  return <section id="products" aria-labelledby="capabilities-title" className="scroll-mt-6 py-14 sm:py-20">
    <div className="mb-9 max-w-2xl"><p className="text-xs font-semibold tracking-[.2em] text-violet-700">RESEARCH TO CREATIVE</p><h2 id="capabilities-title" className="mt-3 text-3xl font-semibold tracking-tight text-violet-950 sm:text-4xl">One direction for your next campaign.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Start with brand and audience research today. Here’s where Orbit is going next.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map((item, index) => <article key={item.title} id={index === 4 ? "orbit-studio" : undefined} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-violet-300">
      <div className="mb-6 flex items-center justify-between"><span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-2xl text-violet-700">{item.symbol}</span><span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.live ? "bg-cyan-50 text-cyan-900" : "bg-slate-100 text-slate-500"}`}>{item.live ? "Available now" : "Coming next"}</span></div>
      <p className="mb-2 text-xs text-slate-400">0{index + 1}</p><h3 className="text-lg font-semibold text-violet-950">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
    </article>)}</div>
  </section>;
}
