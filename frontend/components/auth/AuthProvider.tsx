"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, logout as endSession, type User } from "@/app/auth/api/auth";
import { useRouter } from "next/navigation";
const Context = createContext<{ user: User | null; loading: boolean; setUser: (user: User | null) => void; logout: () => Promise<void> }>({ user: null, loading: true, setUser: () => {}, logout: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true);
  useEffect(() => { let live = true; getSession().then(value => { if (live) setUser(value); }).catch(() => {}).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, []);
  async function logout() { await endSession(); setUser(null); router.push("/analyze"); router.refresh(); }
  return <Context.Provider value={{ user, loading, setUser, logout }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
