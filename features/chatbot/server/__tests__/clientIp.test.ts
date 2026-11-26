import { describe, expect, test } from "bun:test";
import { clientIp } from "../clientIp";

describe("clientIp", () => {
  test("prefers the host-set Vercel header over a client-sent x-forwarded-for", () => {
    expect(clientIp({ "x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "6.6.6.6" })).toBe("9.9.9.9");
  });

  test("uses x-real-ip before x-forwarded-for", () => {
    expect(clientIp({ "x-real-ip": "8.8.8.8", "x-forwarded-for": "6.6.6.6" })).toBe("8.8.8.8");
  });

  test("takes the first x-forwarded-for entry", () => {
    expect(clientIp({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1" })).toBe("1.2.3.4");
  });

  test("falls back to the socket, then 'unknown'", () => {
    expect(clientIp({}, "127.0.0.1")).toBe("127.0.0.1");
    expect(clientIp({})).toBe("unknown");
  });
});
