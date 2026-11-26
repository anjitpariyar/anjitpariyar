import { describe, expect, test } from "bun:test";
import { checkBotGuard, createDailyCap } from "../botGuard";

const options = { siteUrl: "https://www.anjitpariyar.com.np", allowedOrigins: ["https://staging.example.com"] };
const browser = {
  host: "www.anjitpariyar.com.np",
  origin: "https://www.anjitpariyar.com.np",
  "content-type": "application/json",
  "x-chat-client": "web",
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
};

const reason = (headers: Record<string, string | undefined>) => {
  const r = checkBotGuard(headers, options);
  return r.ok ? "ok" : r.reason;
};

describe("bot guard", () => {
  test("allows the chat page in a browser", () => {
    expect(reason(browser)).toBe("ok");
    expect(reason({ ...browser, origin: "https://anjitpariyar.com.np" })).toBe("ok");
    expect(reason({ ...browser, origin: "https://staging.example.com" })).toBe("ok");
    expect(reason({ ...browser, host: "localhost:3000", origin: "http://localhost:3000" })).toBe("ok");
    expect(reason({ ...browser, origin: undefined, referer: "https://www.anjitpariyar.com.np/chat" })).toBe("ok");
  });

  test("blocks bots, scripts and headless browsers", () => {
    for (const ua of ["", "curl/8.5.0", "python-requests/2.31", "Googlebot/2.1", "Mozilla/5.0 HeadlessChrome/120.0", "axios/1.6"]) {
      expect(reason({ ...browser, "user-agent": ua })).toBe("bot_user_agent");
    }
  });

  test("blocks requests that don't come from the chat page", () => {
    expect(reason({ ...browser, "x-chat-client": undefined })).toBe("missing_client_header");
    expect(reason({ ...browser, "content-type": "application/x-www-form-urlencoded" })).toBe("not_json");
    expect(reason({ ...browser, origin: undefined })).toBe("foreign_origin");
    expect(reason({ ...browser, origin: "https://evil.example" })).toBe("foreign_origin");
    expect(reason({ ...browser, origin: "https://anjitpariyar.com.np.evil.example" })).toBe("foreign_origin");
  });

  test("daily AI cap resets each UTC day", () => {
    let t = Date.UTC(2026, 10, 26, 10);
    const take = createDailyCap(2, () => t);
    expect([take(), take(), take()]).toEqual([true, true, false]);
    t = Date.UTC(2026, 10, 27, 0, 1);
    expect(take()).toBe(true);
  });
});
