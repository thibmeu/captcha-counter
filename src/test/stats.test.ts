import { describe, it, expect } from "vitest";
import { computeStats } from "../popup/stats";
import type { CaptchaEvent } from "../types";

function event(
  captcha_type: CaptchaEvent["captcha_type"],
  event_type: CaptchaEvent["event_type"],
): CaptchaEvent {
  return { id: crypto.randomUUID(), site: "example.com", captcha_type, event_type, timestamp: Date.now() };
}

describe("computeStats", () => {
  it("returns all zeros for an empty event list", () => {
    const stats = computeStats([]);
    expect(stats.turnstile).toEqual({ clicked: 0, success: 0, failure: 0 });
    expect(stats.recaptcha).toEqual({ clicked: 0, success: 0, failure: 0 });
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
  });

  it("does not mix turnstile and recaptcha counts", () => {
    const events = [event("turnstile", "success"), event("recaptcha", "success")];
    const stats = computeStats(events);
    expect(stats.turnstile.success).toBe(1);
    expect(stats.recaptcha.success).toBe(1);
  });
});
