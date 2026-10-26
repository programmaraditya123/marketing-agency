import { http1 } from "@/lib/http1";
export interface User { id: string; name: string; email: string }
export async function getSession() { return (await http1.get<{ data: { user: User | null } }>("/auth/me")).data.user; }
export async function authenticate(mode: "login" | "register", input: { email: string; password: string; name?: string }) {
  const response = await http1.post<{ data: { user: User } }>(`/auth/${mode}`, input);
  return response.data.user;
}
export async function logout() { await http1.post("/auth/logout", {}); }
