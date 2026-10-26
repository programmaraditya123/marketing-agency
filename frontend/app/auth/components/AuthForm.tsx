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
      const input = { email: String(data.get("email")), password: String(data.get("password")), ...(mode === "register" ? { name: String(data.get("name")) } : {}) };
      setUser(await authenticate(mode, input)); router.push("/analyze"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign in. Please try again."); }
    finally { setBusy(false); }
  }
  if (user) return <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center"><h1 className="text-2xl font-semibold text-violet-950">You’re signed in, {user.name}.</h1><Link href="/analyze" className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm text-white">Open workspace ↗</Link></div>;
  return <div className="grid overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/30 md:grid-cols-2"><div className="relative overflow-hidden bg-linear-to-br from-violet-100 via-violet-50 to-cyan-50 p-8 sm:p-12"><p className="text-[10px] font-semibold tracking-[.2em] text-violet-600">YOUR IDEAS DESERVE A HOME</p><h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-violet-950">A clearer brand.<br />A brighter next move.</h1><p className="mt-6 text-sm leading-8 text-slate-600">Keep your research, your audience insights, and your plans in one connected workspace.</p><div className="mt-10 space-y-4 text-xs text-violet-800">{["Save your website research", "Keep your guest reports when you sign in", "Continue across your devices"].map(text => <p key={text}>✓ <span className="ml-2">{text}</span></p>)}</div><p className="mt-14 text-[10px] font-semibold tracking-widest text-violet-400">ORBIT BY VIDORAHUB</p></div>
    <div className="p-8 sm:p-12"><div className="mb-8 flex rounded-xl bg-slate-100 p-1">{(["login", "register"] as const).map(value => <button key={value} onClick={() => { setMode(value); setError(""); }} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold ${mode === value ? "bg-white text-violet-700 shadow-sm" : "text-slate-400"}`}>{value === "login" ? "Sign in" : "Create account"}</button>)}</div><h2 className="text-2xl font-semibold text-slate-900">{mode === "login" ? "Welcome back." : "Make room for what’s next."}</h2><p className="mt-3 text-xs leading-6 text-slate-500">{mode === "login" ? "Your brand workspace is waiting for you." : "Your current guest research will join your account."}</p>
      <form key={mode} action={submit} className="mt-7 space-y-5">{mode === "register" && <div><label htmlFor="name" className="mb-2 block text-xs font-semibold text-slate-700">Your name</label><input id="name" name="name" required maxLength={80} pattern=".*\S.*" autoComplete="name" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></div>}<div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-700">Email address</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@yourbrand.com" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></div><div><label htmlFor="password" className="mb-2 block text-xs font-semibold text-slate-700">Password</label><input id="password" name="password" type="password" required minLength={12} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" />{mode === "register" && <p className="mt-2 text-[10px] text-slate-400">Use at least 12 characters.</p>}</div>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-6 text-red-700">{error}</p>}<button disabled={busy} className="h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{busy ? "Connecting…" : mode === "login" ? "Sign in ↗" : "Create account ↗"}</button></form><Link href="/analyze" className="mt-5 block text-center text-xs text-slate-400 hover:text-violet-600">Continue as a guest →</Link>
    </div></div>;
}
