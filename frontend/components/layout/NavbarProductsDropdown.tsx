"use client";
import { useState, useRef, useEffect } from "react";

interface Product {
  name: string;
  url: string;
  desc: string;
  badge?: string;
  color: string;
}

const PRODUCTS: Product[] = [
  {
    name: "Vidorahub",
    url: "https://www.vidorahub.com",
    desc: "A video sharing platform",
    color: "from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    name: "Vidorahub Studio",
    url: "https://studio.vidorahub.com",
    desc: "A marketplace for brands and creators",
    badge: "Ecosystem",
    color: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30",
  },
  {
    name: "KukuNotes",
    url: "https://www.kukunotes.com",
    desc: "An AI meeting assistant for your daily work",
    badge: "AI Tool",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
  },
];

export default function NavbarProductsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors focus:outline-none"
      >
        <span>Products</span>
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-white" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0a0d1d]/95 p-2.5 shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10 z-50">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            VidoraHub Ecosystem
          </div>
          <div className="space-y-1">
            {PRODUCTS.map((product) => (
              <a
                key={product.name}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-white/[0.06]"
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br ${product.color}`}>
                  <span className="text-xs font-bold">{product.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {product.name}
                    </span>
                    {product.badge && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
                        {product.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-cyan-300">
                      ↗
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors leading-tight">
                    {product.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
