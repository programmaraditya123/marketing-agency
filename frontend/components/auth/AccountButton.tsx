"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AccountButton() {
  const { user, logout } = useAuth();
  const [error, setError] = useState("");

  return (
    <div className="flex items-center gap-2.5 text-xs text-slate-300">
      {user ? (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/30 bg-violet-600/30 text-xs font-bold text-violet-200">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden max-w-28 truncate font-medium text-slate-200 sm:inline">{user.name}</span>
          <button
            onClick={() => { void logout().catch(() => setError("Sign out failed.")); }}
            className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link
          href="/auth"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          Sign in
        </Link>
      )}
      {error && <span role="alert" className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
