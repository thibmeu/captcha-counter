import { describe, it, expect, vi } from "vitest";

// Mock the content script entry point so importing the detectors doesn't
// trigger DOM observation or message listeners as a side effect.
vi.mock("../content/index", () => ({ sendEvent: vi.fn() }));

import { TurnstileDetector } from "../content/detectors/turnstile";
import { RecaptchaDetector } from "../content/detectors/recaptcha";

describe("TurnstileDetector.matchesIframe", () => {
  const d = new TurnstileDetector();

  it("matches Cloudflare challenge URLs", () => {
    expect(d.matchesIframe("https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/abc")).toBe(true);
  });

  it("does not match unrelated cloudflare URLs", () => {
    expect(d.matchesIframe("https://cloudflare.com/something")).toBe(false);
  });

  it("does not match reCAPTCHA URLs", () => {
    expect(d.matchesIframe("https://www.google.com/recaptcha/api2/anchor?ar=1")).toBe(false);
  });

  it("does not match an empty string", () => {
    expect(d.matchesIframe("")).toBe(false);
  });
});

describe("RecaptchaDetector.matchesIframe", () => {
  const d = new RecaptchaDetector();

  it("matches google.com recaptcha anchor frames", () => {
    expect(d.matchesIframe("https://www.google.com/recaptcha/api2/anchor?ar=1&k=KEY")).toBe(true);
  });

  it("matches recaptcha.net anchor frames", () => {
    expect(d.matchesIframe("https://www.recaptcha.net/recaptcha/api2/anchor?ar=1")).toBe(true);
  });

  it("does not match the bframe popup (not an anchor)", () => {
    expect(d.matchesIframe("https://www.google.com/recaptcha/api2/bframe?hl=en&v=abc")).toBe(false);
  });

  it("does not match Turnstile URLs", () => {
    expect(d.matchesIframe("https://challenges.cloudflare.com/cdn-cgi/challenge-platform/turnstile")).toBe(false);
  });

  it("does not match an empty string", () => {
    expect(d.matchesIframe("")).toBe(false);
  });
});
