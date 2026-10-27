"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { authenticate } from "../api/auth";

export default function AuthForm({ initialMode }: { initialMode: "login" | "register" }) {
  const [mode, setMode] = useState(initialMode), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const { setUser, user } = useAuth();
  const router = useRouter();

  async function submit(data: FormData) {
    setBusy(true); setError("");
    try {
      const input = {
        email: String(data.get("email")),
        password: String(data.get("password")),
        ...(mode === "register" ? { name: String(data.get("name")) } : {}),
      };
      setUser(await authenticate(mode, input));
      router.push("/analyze");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please verify credentials.");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">Signed in as {user.name}</h1>
        <p className="mt-2 text-xs text-slate-500">Your research and activity are synced to this account.</p>
        <Link href="/analyze" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-violet-700">
          Open Workspace ↗
        </Link>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-violet-100/40 md:grid-cols-2">
      <div className="relative flex flex-col justify-between overflow-hidden bg-linear-to-br from-violet-900 via-indigo-950 to-[#080b19] p-8 text-white sm:p-12">
        <div>
          <p className="text-[10px] font-bold tracking-[.2em] text-cyan-300 uppercase">Orbit Identity</p>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Unified workspace for brand intelligence.
          </h1>
          <p className="mt-4 text-xs leading-relaxed text-slate-300 sm:text-sm">
            Persist historical audits, track competitor evolution, and retain your customized marketing briefs across sessions.
          </p>
          <div className="mt-8 space-y-3 text-xs text-slate-200">
            {["Save unlimited website research dossiers", "Auto-transfer your current guest report", "Access your brand briefs on any device"].map(text => (
              <p key={text} className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">✓</span>
                <span>{text}</span>
              </p>
            ))}
          </div>
        </div>
        <p className="mt-10 text-[10px] font-bold tracking-widest text-slate-500">ORBIT BY VIDORAHUB</p>
      </div>

      <div className="p-8 sm:p-12">
        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          {(["login", "register"] as const).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => { setMode(value); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                mode === value ? "bg-white text-violet-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {value === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-900">{mode === "login" ? "Welcome back" : "Create your workspace"}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {mode === "login" ? "Sign in to access your saved dossiers and briefs." : "Your active guest research will automatically link to your new account."}
        </p>

        <form key={mode} action={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name</label>
              <input id="name" name="name" required maxLength={80} pattern=".*\S.*" autoComplete="name" placeholder="Alex Morgan" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none focus:border-violet-400" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address</label>
            <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@brand.com" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none focus:border-violet-400" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
            <input id="password" name="password" type="password" required minLength={12} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••••••" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none focus:border-violet-400" />
            {mode === "register" && <p className="mt-1 text-[10px] text-slate-400">Must be at least 12 characters.</p>}
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}

          <button disabled={busy} className="mt-2 h-11 w-full rounded-xl bg-violet-600 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50">
            {busy ? "Authenticating…" : mode === "login" ? "Sign In to Workspace ↗" : "Create Account & Transfer Dossiers ↗"}
          </button>
        </form>

        <Link href="/analyze" className="mt-5 block text-center text-xs text-slate-400 hover:text-violet-600">
          Continue as Guest →
        </Link>
      </div>
    </div>
  );
}
