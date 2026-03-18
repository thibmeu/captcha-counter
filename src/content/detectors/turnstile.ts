import { CaptchaDetector } from "./base";

export class TurnstileDetector extends CaptchaDetector {
  readonly captchaType = "turnstile" as const;

  matchesIframe(src: string): boolean {
    return src.includes("challenges.cloudflare.com");
  }
}
