"use client";
import { useEffect, useRef, useState } from "react";
import { CAPABILITIES } from "./capabilities/capabilitiesData";
import CapabilityCard from "./capabilities/CapabilityCard";

export default function OrbitCapabilities() {
  const [assembled, setAssembled] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAssembled(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="products"
      aria-labelledby="capabilities-title"
      className="scroll-mt-6 py-12 sm:py-16 overflow-hidden"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2
            id="capabilities-title"
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight"
          >
            From website crawl to full campaign roadmap.
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600">
            Orbit replaces fragmented marketing guesswork with unified, evidence-linked brand intelligence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAssembled(false);
            setTimeout(() => setAssembled(true), 150);
          }}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-500/20"
        >
          <span>✨</span>
          <span>Re-assemble Cards</span>
        </button>
      </div>

      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((item, index) => (
          <CapabilityCard
            key={item.id}
            item={item}
            index={index}
            assembled={assembled}
          />
        ))}
      </div>
    </section>
  );
}
