import { env } from "@/config/env";
import { createHttpClient } from "./http";
const client = createHttpClient(env.fastifyUrl, "include");
let bootstrap: Promise<unknown> | undefined;
function ensureSession() {
  return bootstrap ??= client.get("/auth/me").catch(error => { bootstrap = undefined; throw error; });
}
export const http1 = {
  async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    if (path !== "/auth/me") await ensureSession();
    else { const result = await ensureSession(); return result as T; }
    return client.get<T>(path, signal);
  },
  async post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    await ensureSession();
    return client.post<T>(path, body, signal);
  },
};
