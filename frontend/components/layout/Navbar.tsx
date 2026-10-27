import Link from "next/link";
import Brand from "./Brand";
import AccountButton from "../auth/AccountButton";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080b19]/90 backdrop-blur-md">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-10">
        <Brand compact />
        <div className="order-3 flex w-full items-center justify-center gap-6 text-xs font-medium sm:order-none sm:w-auto sm:gap-7 sm:text-sm">
          <Link href="/#products" className="text-slate-300 transition hover:text-cyan-300">
            Products
          </Link>
          <Link href="/#orbit-studio" className="text-slate-300 transition hover:text-cyan-300">
            Orbit Studio
          </Link>
          <Link href="/how-it-works" className="text-slate-300 transition hover:text-cyan-300">
            How It Works
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <AccountButton />
          <Link
            href="/analyze"
            className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:from-violet-500 hover:to-indigo-500 sm:px-5"
          >
            <span>Analyze Website</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
