import Link from "next/link";
import Brand from "./Brand";
import AccountButton from "../auth/AccountButton";
export default function Navbar() {
  return <header className="border-b border-white/10 bg-[#080b19]">
    <nav aria-label="Main navigation" className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2 sm:py-3 lg:px-10">
      <Brand compact />
      <div className="order-3 flex w-full items-center justify-center gap-8 text-xs font-medium sm:order-none sm:w-auto sm:gap-7 sm:text-sm"><Link href="/#products" className="text-slate-300 transition hover:text-cyan-300">Products</Link><Link href="/#orbit-studio" className="text-slate-300 transition hover:text-cyan-300">Orbit Studio</Link><Link href="/how-it-works#about" className="text-slate-300 transition hover:text-cyan-300">About</Link></div>
      <div className="flex items-center gap-4"><AccountButton /><Link href="/analyze" className="rounded-full bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500 sm:px-5">Analyze Website <span aria-hidden="true" className="ml-1">↗</span></Link></div>
    </nav>
  </header>;
}
