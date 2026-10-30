"use client";
import { useState } from "react";
import Link from "next/link";
import Brand from "./Brand";
import NavbarProductsDropdown from "./NavbarProductsDropdown";
import NavbarAuth from "./NavbarAuth";
import NavbarMobileMenu from "./NavbarMobileMenu";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full px-3 sm:px-6">
      <div className="relative mx-auto max-w-6xl">
        <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 h-14 w-3/4 rounded-full bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-cyan-500/20 blur-2xl -z-10" />

        <nav
          aria-label="Main navigation"
          className="relative flex items-center justify-between rounded-2xl sm:rounded-full border border-white/10 bg-[#090b16]/75 px-3.5 py-2 sm:px-6 sm:py-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] backdrop-blur-xl ring-1 ring-white/10 before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent"
        >
          <div className="flex items-center gap-2">
            <Brand compact />
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-7 text-xs sm:text-sm font-medium">
            <NavbarProductsDropdown />
            <Link href="/how-it-works" className="text-slate-300 hover:text-white transition-colors">
              How It Works
            </Link>
            <a
              href="https://studio.vidorahub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Creators
            </a>
            <a
              href="https://studio.vidorahub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Brands
            </a>
          </div>

          <div className="hidden sm:flex items-center">
            <NavbarAuth />
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/analyze"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs"
            >
              Analyze
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white"
            >
              {mobileOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <NavbarMobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </header>
  );
}
