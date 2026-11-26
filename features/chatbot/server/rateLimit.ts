/**
 * Small fixed-window rate limiter, in memory.
 *
 * Limitation: on serverless hosts each instance has its own memory, so this
 * limits per instance, not globally. It still stops casual abuse and runaway
 * loops; for a hard global cap use an external store (e.g. Upstash Redis or
 * a Supabase table) behind the same interface.
 */
type Window = { start: number; count: number };
type Entry = { minute: Window; hour: Window };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function createRateLimiter(limits: { perMinute: number; perHour: number }, now: () => number = Date.now) {
  const entries = new Map<string, Entry>();
  let lastPrune = now();

  const tick = (w: Window, size: number, t: number) => {
    if (t - w.start >= size) {
      w.start = t;
      w.count = 0;
    }
  };

  return function check(key: string): RateLimitResult {
    const t = now();
    if (t - lastPrune > 10 * 60_000) {
      for (const [k, e] of entries) if (t - e.hour.start > 3_600_000) entries.delete(k);
      lastPrune = t;
    }
    let e = entries.get(key);
    if (!e) {
      e = { minute: { start: t, count: 0 }, hour: { start: t, count: 0 } };
      entries.set(key, e);
    }
    tick(e.minute, 60_000, t);
    tick(e.hour, 3_600_000, t);
    if (e.minute.count >= limits.perMinute) {
      return { ok: false, retryAfterSeconds: Math.ceil((e.minute.start + 60_000 - t) / 1000) };
    }
    if (e.hour.count >= limits.perHour) {
      return { ok: false, retryAfterSeconds: Math.ceil((e.hour.start + 3_600_000 - t) / 1000) };
    }
    e.minute.count++;
    e.hour.count++;
    return { ok: true };
  };
}
