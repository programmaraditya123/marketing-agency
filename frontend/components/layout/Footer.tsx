import Link from "next/link";
import Brand from "./Brand";
export default function Footer() {
  return <footer className="border-t border-white/10 bg-[#080b19]">
    <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-9 sm:flex-row sm:items-center sm:justify-between lg:px-10"><Brand /><p className="text-sm text-slate-400">Understand the brand. Find your next move.</p><div className="flex gap-6 text-sm text-slate-300"><Link href="/how-it-works" className="hover:text-cyan-300">How it works</Link><a href="https://www.vidorahub.com/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">VidoraHub ↗</a></div></div>
  </footer>;
}
