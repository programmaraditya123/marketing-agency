import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { site } from "@/config/site";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s | Orbit by VidoraHub" },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: "VidoraHub", url: "https://www.vidorahub.com/" }],
  creator: "VidoraHub",
  openGraph: { type: "website", locale: "en_US", siteName: site.name, url: site.url,
    title: site.title, description: site.description,
    images: [{ url: site.socialImage, width: 1200, height: 630, alt: "Orbit by VidoraHub" }] },
  twitter: { card: "summary_large_image", title: site.title, description: site.description, images: [site.socialImage] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body className="min-h-screen antialiased"><AuthProvider><a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-violet-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a><Navbar />{children}<Footer /></AuthProvider></body></html>;
}
