"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import HeroHeading from "./HeroHeading";
import HeroInputForm from "./HeroInputForm";
import HeroCarousel from "./HeroCarousel";

export default function HeroSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(value: string) {
    try {
      setBusy(true);
      setError("");
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Please enter a valid HTTP or HTTPS website URL.");
      }
      router.push(`/analyze?website=${encodeURIComponent(url.href)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enter a valid website address.");
      setBusy(false);
    }
  }

  return (
    <section
      id="analyze"
      className="relative mt-6 sm:mt-8 mb-4 sm:mb-6 min-h-[420px] sm:min-h-[450px] md:min-h-[470px] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-b from-[#080b19] via-[#0b0e24] to-[#070914] px-4 py-4 sm:py-6 shadow-2xl"
    >
      {/* Ambient Lighting Glows matching Navbar */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-full max-w-4xl rounded-full bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-cyan-500/15 blur-3xl -z-0" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-4/5 rounded-full bg-indigo-500/10 blur-[100px] -z-0" />

      {/* Layer 1: Continuous 6-Card Showcase Carousel Moving BEHIND Heading & Input */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden opacity-60 sm:opacity-75">
        <HeroCarousel />
      </div>

      {/* Radial soft backdrop protection ensuring high contrast */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-[#080b19]/80 via-[#080b19]/50 to-transparent z-15" />

      {/* Layer 2: Heading & Floating Input Field in FOREGROUND */}
      <div className="relative z-20 w-full flex flex-col items-center">
        <HeroHeading />
        <HeroInputForm onSubmit={submit} busy={busy} error={error} />
      </div>
    </section>
  );
}
