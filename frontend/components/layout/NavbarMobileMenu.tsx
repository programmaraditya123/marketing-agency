"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NavbarMobileMenu({ open, onClose }: Props) {
  const { user, logout } = useAuth();
  const [productsOpen, setProductsOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="md:hidden mt-3 rounded-2xl border border-white/10 bg-[#090b18]/95 p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
      <div className="flex flex-col space-y-3 text-sm">
        <div>
          <button
            type="button"
            onClick={() => setProductsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between font-medium text-slate-200 py-1"
          >
            <span>Products</span>
            <span className={`text-xs transition-transform ${productsOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
          {productsOpen && (
            <div className="mt-2 ml-2 space-y-2 border-l border-white/10 pl-3">
              <a
                href="https://www.vidorahub.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block text-xs text-slate-300 hover:text-cyan-300"
              >
                <div className="font-semibold text-white">Vidorahub ↗</div>
                <div className="text-[11px] text-slate-400">A video sharing platform</div>
              </a>
              <a
                href="https://studio.vidorahub.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block text-xs text-slate-300 hover:text-cyan-300"
              >
                <div className="font-semibold text-white">Vidorahub Studio ↗</div>
                <div className="text-[11px] text-slate-400">A marketplace for brands and creators</div>
              </a>
              <a
                href="https://www.kukunotes.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block text-xs text-slate-300 hover:text-cyan-300"
              >
                <div className="font-semibold text-white">KukuNotes ↗</div>
                <div className="text-[11px] text-slate-400">An AI meeting assistant for your daily work</div>
              </a>
            </div>
          )}
        </div>

        <Link href="/how-it-works" onClick={onClose} className="font-medium text-slate-300 hover:text-white py-1">
          How It Works
        </Link>
        <a href="https://studio.vidorahub.com" target="_blank" rel="noopener noreferrer" onClick={onClose} className="font-medium text-slate-300 hover:text-white py-1">
          Creators ↗
        </a>
        <a href="https://studio.vidorahub.com" target="_blank" rel="noopener noreferrer" onClick={onClose} className="font-medium text-slate-300 hover:text-white py-1">
          Brands ↗
        </a>

        <div className="border-t border-white/10 pt-3">
          {user ? (
            <button
              onClick={() => { void logout(); onClose(); }}
              className="w-full text-left font-medium text-rose-300 hover:text-rose-200 py-1"
            >
              Sign out ({user.name || user.email})
            </button>
          ) : (
            <Link href="/auth" onClick={onClose} className="block font-medium text-slate-300 hover:text-white py-1">
              Log in
            </Link>
          )}
          <Link
            href="/analyze"
            onClick={onClose}
            className="mt-3 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md"
          >
            Analyze Website ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
