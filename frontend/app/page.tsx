import HeroSection from "./components/hero/HeroSection";
import HowItWorks from "./components/HowItWorks";
import type { Metadata } from "next";
import OrbitCapabilities from "./components/OrbitCapabilities";
import HomeStructuredData from "./components/HomeStructuredData";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-10">
      <HomeStructuredData />
      <HeroSection />
      <OrbitCapabilities />
      <HowItWorks />
    </main>
  );
}
