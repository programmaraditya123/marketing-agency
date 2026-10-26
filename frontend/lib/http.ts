export function createHttpClient(baseUrl: string, credentials: RequestCredentials = "omit") {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      ...options, credentials, signal: options.signal || AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", ...(credentials === "include" ? { "X-Orbit-Request": "1" } : {}), ...options.headers }, cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || "The service could not complete the request. Please try again.");
    return body as T;
  }
  return {
    get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
    post: <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>(path, { method: "POST", body: JSON.stringify(body), signal }),
  };
}
