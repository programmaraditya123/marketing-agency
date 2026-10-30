import HeroCard, { type HeroCardData } from "./HeroCard";

const HERO_CARDS: HeroCardData[] = [
  {
    title: "SEO Gap War Room",
    subtitle: "Head-to-Head Comparison",
    rating: "9.8",
    breadcrumb: "Orbit / SEO Comparison",
    accentGlow: "bg-emerald-500",
    visualType: "seo",
  },
  {
    title: "Social Strategy Engine",
    subtitle: "7-Day Content Playbook",
    rating: "9.6",
    breadcrumb: "Orbit / Content Strategy",
    accentGlow: "bg-violet-600",
    visualType: "content",
  },
  {
    title: "Competitor Radar",
    subtitle: "10 Rivals · USP Differentiation",
    rating: "9.4",
    breadcrumb: "Orbit / Competitors",
    accentGlow: "bg-blue-600",
    visualType: "competitor",
  },
  {
    title: "Market Demand",
    subtitle: "52-Week Google Search Momentum",
    rating: "8.9",
    breadcrumb: "Orbit / Market Demand",
    accentGlow: "bg-cyan-500",
    visualType: "trends",
  },
  {
    title: "30-Day Budget Allocation",
    subtitle: "Paid · Organic · Owned Channels",
    rating: "9.2",
    breadcrumb: "Orbit / Marketing Plan",
    accentGlow: "bg-amber-500",
    visualType: "budget",
  },
  {
    title: "Verified Brand Dossier",
    subtitle: "100% Crawl Evidence & Personas",
    rating: "9.7",
    breadcrumb: "Orbit / Brand Brief",
    accentGlow: "bg-indigo-600",
    visualType: "dossier",
  },
];

export default function HeroCarousel() {
  return (
    <div className="relative w-full overflow-hidden py-2 select-none pointer-events-none">
      {/* Side Vignette Fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-44 bg-gradient-to-r from-[#080b19] via-[#080b19]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-44 bg-gradient-to-l from-[#080b19] via-[#080b19]/80 to-transparent z-10" />

      {/* Infinite Continuous Moving Marquee */}
      <div className="animate-hero-marquee flex gap-6 px-4">
        {[...HERO_CARDS, ...HERO_CARDS].map((card, idx) => (
          <HeroCard key={`${card.title}-${idx}`} card={card} />
        ))}
      </div>
    </div>
  );
}
