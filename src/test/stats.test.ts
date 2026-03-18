import { describe, it, expect } from "vitest";
import { computeStats, computeStatsBySite } from "../popup/stats";
import type { CaptchaEvent } from "../types";

function event(
  captcha_type: CaptchaEvent["captcha_type"],
  event_type: CaptchaEvent["event_type"],
  site = "example.com",
): CaptchaEvent {
  return { id: crypto.randomUUID(), site, captcha_type, event_type, timestamp: Date.now() };
}

describe("computeStats", () => {
  it("returns all zeros for an empty event list", () => {
    const stats = computeStats([]);
    expect(stats.turnstile).toEqual({ clicked: 0, success: 0, failure: 0 });
    expect(stats.recaptcha).toEqual({ clicked: 0, success: 0, failure: 0 });
    expect(stats.hcaptcha).toEqual({ clicked: 0, success: 0, failure: 0 });
  });

  it("counts each event type independently per provider", () => {
    const events = [
      event("turnstile", "clicked"),
      event("turnstile", "success"),
      event("turnstile", "success"),
      event("recaptcha", "failure"),
    ];
    const stats = computeStats(events);
    expect(stats.turnstile).toEqual({ clicked: 1, success: 2, failure: 0 });
    expect(stats.recaptcha).toEqual({ clicked: 0, success: 0, failure: 1 });
    expect(stats.hcaptcha).toEqual({ clicked: 0, success: 0, failure: 0 });
  });

  it("does not mix turnstile and recaptcha counts", () => {
    const events = [event("turnstile", "success"), event("recaptcha", "success")];
    const stats = computeStats(events);
    expect(stats.turnstile.success).toBe(1);
    expect(stats.recaptcha.success).toBe(1);
  });

  it("counts hcaptcha events", () => {
    const events = [
      event("hcaptcha", "clicked"),
      event("hcaptcha", "success"),
      event("hcaptcha", "failure"),
    ];
    const stats = computeStats(events);
    expect(stats.hcaptcha).toEqual({ clicked: 1, success: 1, failure: 1 });
  });
});

describe("computeStatsBySite", () => {
  it("returns an empty map for no events", () => {
    expect(computeStatsBySite([]).size).toBe(0);
  });

  it("ignores clicked events", () => {
    const events = [event("turnstile", "clicked", "foo.com")];
    expect(computeStatsBySite(events).size).toBe(0);
  });

  it("aggregates success and failure per site", () => {
    const events = [
      event("turnstile", "success", "a.com"),
      event("recaptcha", "success", "a.com"),
      event("turnstile", "failure", "b.com"),
    ];
    const map = computeStatsBySite(events);
    expect(map.get("a.com")).toEqual({ success: 2, failure: 0 });
    expect(map.get("b.com")).toEqual({ success: 0, failure: 1 });
  });

  it("sorts by total descending when iterated after sorting", () => {
    const events = [
      event("turnstile", "success", "small.com"),
      event("turnstile", "success", "big.com"),
      event("turnstile", "failure", "big.com"),
      event("turnstile", "success", "big.com"),
    ];
    const map = computeStatsBySite(events);
    const sorted = [...map.entries()].sort(
      (a, b) => (b[1].success + b[1].failure) - (a[1].success + a[1].failure),
    );
    expect(sorted[0][0]).toBe("big.com");
    expect(sorted[1][0]).toBe("small.com");
  });
});
