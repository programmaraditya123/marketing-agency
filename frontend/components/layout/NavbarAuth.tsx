"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function NavbarAuth() {
  const { user, logout, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    try {
      setBusy(true);
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="hidden sm:block h-4 w-px bg-white/15" aria-hidden="true" />

      {loading ? (
        <div className="h-6 w-14 animate-pulse rounded bg-white/10" />
      ) : user ? (
        <div className="flex items-center gap-2.5">
          <div
            title={user.email}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/40 bg-gradient-to-tr from-violet-600 to-indigo-600 text-[11px] font-bold text-white shadow-xs"
          >
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="text-xs sm:text-sm font-medium text-slate-300 hover:text-rose-300 transition-colors disabled:opacity-50"
          >
            {busy ? "Signing out..." : "Log out"}
          </button>
        </div>
      ) : (
        <Link
          href="/auth"
          className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Log in
        </Link>
      )}

      <Link
        href="/analyze"
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] hover:shadow-indigo-600/40 active:scale-[0.98]"
      >
        <span>Analyze Website</span>
        <span aria-hidden="true" className="text-xs">↗</span>
      </Link>
    </div>
  );
}
