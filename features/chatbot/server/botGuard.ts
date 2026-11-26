/**
 * Cheap checks that keep bots and scripts off /api/chat before any data
 * loading or Gemini call happens. None of them is unbeatable on its own (a
 * determined script can fake headers), but together with the per-IP rate
 * limit and the daily AI cap they stop crawlers, scanners, cross-site use
 * and casual curl loops.
 *
 *  1. Same origin: browsers always send `Origin` on a fetch POST; it must be
 *     this site (or a host in CHAT_ALLOWED_ORIGINS).
 *  2. Client header: `X-Chat-Client: web` is sent by useChat. A custom header
 *     also forces a CORS preflight, which other sites can't pass.
 *  3. JSON only: rejects HTML form posts.
 *  4. User agent: rejects empty agents and known bots, HTTP libraries and
 *     headless browsers.
 */
import type { IncomingHttpHeaders } from "http";

export const CHAT_CLIENT_HEADER = "x-chat-client";
export const CHAT_CLIENT_VALUE = "web";

const BOT_UA =
  /bot\b|crawl|spider|slurp|scrap|curl|wget|httpie|python-requests|python-urllib|aiohttp|httpx|go-http-client|okhttp|java\/|libwww|axios|node-fetch|undici|postman|insomnia|headlesschrome|phantomjs|puppeteer|playwright|selenium/i;

export type GuardResult = { ok: true } | { ok: false; status: number; reason: string };

const header = (headers: IncomingHttpHeaders, name: string) => {
  const v = headers[name];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
};

const hostOf = (url: string) => {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
};

/** Hosts allowed to call the API: this request's host, the site URL (with and without www), extras. */
export function allowedHosts(headers: IncomingHttpHeaders, siteUrl: string, extraOrigins: string[]): Set<string> {
  const hosts = new Set<string>();
  const add = (h: string) => {
    if (!h) return;
    const host = h.toLowerCase();
    hosts.add(host);
    hosts.add(host.startsWith("www.") ? host.slice(4) : `www.${host}`);
  };
  add(header(headers, "x-forwarded-host").split(",")[0].trim());
  add(header(headers, "host"));
  add(hostOf(siteUrl));
  extraOrigins.forEach((o) => add(hostOf(o)));
  return hosts;
}

export function checkBotGuard(
  headers: IncomingHttpHeaders,
  options: { siteUrl: string; allowedOrigins: string[] }
): GuardResult {
  const ua = header(headers, "user-agent");
  if (!ua || BOT_UA.test(ua)) return { ok: false, status: 403, reason: "bot_user_agent" };

  if (header(headers, CHAT_CLIENT_HEADER) !== CHAT_CLIENT_VALUE) {
    return { ok: false, status: 403, reason: "missing_client_header" };
  }

  if (!header(headers, "content-type").toLowerCase().startsWith("application/json")) {
    return { ok: false, status: 415, reason: "not_json" };
  }

  const origin = header(headers, "origin") || header(headers, "referer");
  const originHost = hostOf(origin);
  if (!originHost || !allowedHosts(headers, options.siteUrl, options.allowedOrigins).has(originHost)) {
    return { ok: false, status: 403, reason: "foreign_origin" };
  }

  return { ok: true };
}

/**
 * Caps Gemini calls per UTC day (per server instance) so a bot that gets
 * past the checks above can't run up the bill. Past the cap, replies come
 * from the free rule-based engine instead.
 */
export function createDailyCap(limit: number, now: () => number = Date.now) {
  let day = "";
  let count = 0;
  return function take(): boolean {
    const today = new Date(now()).toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      count = 0;
    }
    if (count >= limit) return false;
    count++;
    return true;
  };
}
