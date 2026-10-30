export interface CapabilityItem {
  id: string;
  title: string;
  description: string;
  metric: string;
  badge: string;
  symbol: string;
  accent: string;
  path: string;
  scatterClass: string;
}

export const CAPABILITIES: CapabilityItem[] = [
  {
    id: "brand",
    title: "Autonomous Brand Audit",
    description: "Extract verified company offerings, value proposition, and brand voice directly from crawled evidence.",
    metric: "8 Pages Indexed · 100% Sourced",
    badge: "Verified Dossier",
    symbol: "◎",
    accent: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
    path: "/analyze",
    scatterClass: "-translate-x-14 -translate-y-14 -rotate-6 scale-90 opacity-0",
  },
  {
    id: "audience",
    title: "Audience Psychographics",
    description: "Unpack audience segments, acute pain points, core desires, and psychological buying triggers.",
    metric: "Psychographics · Buyer Drivers",
    badge: "Audience Matrix",
    symbol: "↗",
    accent: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30",
    path: "/analyze",
    scatterClass: "-translate-y-16 rotate-3 scale-90 opacity-0",
  },
  {
    id: "competitors",
    title: "Competitor Gap Radar",
    description: "Scan up to 10 direct rivals with live official URLs, pricing tier differences, and positioning gaps.",
    metric: "10 Rivals Audited · 1-Click Scan",
    badge: "Competitor Radar",
    symbol: "⇄",
    accent: "from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30",
    path: "/analyze",
    scatterClass: "translate-x-14 -translate-y-14 rotate-6 scale-90 opacity-0",
  },
  {
    id: "demand",
    title: "Google Trends Momentum",
    description: "Track real-world Google search interest, 52-week trajectory curves, and seasonal demand breakouts.",
    metric: "+38% YoY Search · 52 Weeks",
    badge: "Live Google Trends",
    symbol: "⌁",
    accent: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
    path: "/analyze",
    scatterClass: "-translate-x-14 translate-y-14 rotate-3 scale-90 opacity-0",
  },
  {
    id: "budget",
    title: "Deterministic 30-Day Budget",
    description: "Model daily & monthly spend across highest-ROI Paid, Organic, and Owned channels with 30-day caps.",
    metric: "Minor-Unit Capped · 30-Day Window",
    badge: "Budget Planner",
    symbol: "▤",
    accent: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
    path: "/analyze",
    scatterClass: "translate-y-16 -rotate-3 scale-90 opacity-0",
  },
  {
    id: "seo",
    title: "Head-to-Head SEO War Room",
    description: "Compare metadata & keyword gaps side-by-side against rivals to generate winning outranking snippets.",
    metric: "+48% Organic Upside · Meta Snippets",
    badge: "Flagship War Room",
    symbol: "⌖",
    accent: "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
    path: "/analyze",
    scatterClass: "translate-x-14 translate-y-14 -rotate-6 scale-90 opacity-0",
  },
];
