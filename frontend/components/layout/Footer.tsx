import Link from "next/link";
import Brand from "./Brand";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080b19]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div>
          <Brand />
          <p className="mt-2 text-xs text-slate-400">AI-powered brand research, competitor discovery, and budget marketing plans.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
          <Link href="/analyze" className="transition hover:text-cyan-300">Workspace</Link>
          <Link href="/how-it-works" className="transition hover:text-cyan-300">How It Works</Link>
          <Link href="/auth" className="transition hover:text-cyan-300">Account</Link>
          <a href="https://www.vidorahub.com/" target="_blank" rel="noopener noreferrer" className="transition hover:text-cyan-300">VidoraHub ↗</a>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-[10px] text-slate-500">
        © 2026 Orbit by VidoraHub. All rights reserved.
      </div>
    </footer>
  );
}
