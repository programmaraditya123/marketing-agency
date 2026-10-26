import AnalysisWorkspace from "./components/AnalysisWorkspace";
import HowItWorks from "./components/HowItWorks";
import type { Metadata } from "next";
import OrbitCapabilities from "./components/OrbitCapabilities";
import HomeStructuredData from "./components/HomeStructuredData";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return <main id="main-content" className="mx-auto max-w-7xl px-5 lg:px-10"><HomeStructuredData /><AnalysisWorkspace /><OrbitCapabilities /><HowItWorks /></main>;
}
