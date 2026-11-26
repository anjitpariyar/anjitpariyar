import type { IncomingHttpHeaders } from "http";

/**
 * The visitor's IP, used as the key for every per-IP limit.
 *
 * Only headers set by the host can be trusted. On Vercel,
 * `x-vercel-forwarded-for` and `x-real-ip` are written by the edge and can't
 * be spoofed by the client, so they're read first. A raw `x-forwarded-for`
 * is only safe behind a proxy that overwrites it; self-hosted without one, a
 * client can send any value and get a fresh rate-limit bucket per request.
 */
export function clientIp(headers: IncomingHttpHeaders, socketAddress?: string | null): string {
  for (const name of ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"]) {
    const raw = headers[name];
    const first = (Array.isArray(raw) ? raw[0] : raw)?.split(",")[0]?.trim();
    if (first) return first;
  }
  return socketAddress || "unknown";
}
