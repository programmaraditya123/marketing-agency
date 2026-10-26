import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { AppError } from "../../utils/app-error";
export function normalizeUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value.includes("://") ? value : `https://${value}`); }
  catch { throw new AppError(400, "Enter a valid public website URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port))) {
    throw new AppError(400, "Use a public HTTP or HTTPS website without credentials or a custom port.");
  }
  url.hash = "";
  return url;
}
export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    if (parsed.range() === "unicast") return true;
    // DNS64 networks synthesize 64:ff9b::/96 addresses from IPv4 answers.
    // Classify the embedded destination, not the translation prefix alone.
    const bytes = parsed.toByteArray();
    const nat64Prefix = [0x00, 0x64, 0xff, 0x9b, 0, 0, 0, 0, 0, 0, 0, 0];
    if (bytes.length === 16 && nat64Prefix.every((byte, index) => bytes[index] === byte)) {
      return ipaddr.fromByteArray(bytes.slice(12)).range() === "unicast";
    }
    return false;
  } catch { return false; }
}
export function selectPublicAddress(records: { address: string; family: number }[]): { address: string; family: number } {
  const publicRecords = records.filter(record => isPublicAddress(record.address));
  // Only this checked answer is passed to the pinned HTTP lookup function.
  // Prefer IPv4 over IPv6/NAT64 when both are available on the host network.
  const selected = publicRecords.find(record => record.family === 4) || publicRecords[0];
  if (!selected) {
    throw new AppError(400, "Private and reserved network addresses cannot be crawled.");
  }
  return selected;
}
export async function resolvePublic(url: URL): Promise<{ address: string; family: number }> {
  const records = await lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true });
  return selectPublicAddress(records);
}
