"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
export default function AccountButton() {
  const { user, logout } = useAuth();
  const [error, setError] = useState("");
  return <div className="flex items-center gap-3 text-xs text-slate-300">{user ? <><span className="max-w-24 truncate">{user.name}</span><button onClick={() => { void logout().catch(() => setError("Sign out failed. Try again.")); }} className="hover:text-white">Sign out</button></> : <Link href="/auth" className="hover:text-white">Sign in</Link>}{error && <span role="alert">{error}</span>}</div>;
}
