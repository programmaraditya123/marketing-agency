const key = "orbit_visitor_id";
let temporary: string | undefined;
export function getVisitorId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;
  } catch { /* Private browsing may disable localStorage; the proof cookie still works. */ }
  temporary ||= Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
  try { window.localStorage.setItem(key, temporary); } catch { /* Keep the page-local fallback. */ }
  return temporary;
}
export function rememberVisitorId(value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value) || typeof window === "undefined") return;
  temporary = value;
  try { window.localStorage.setItem(key, value); } catch { /* HttpOnly proof remains authoritative. */ }
}
