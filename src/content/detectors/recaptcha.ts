import { CaptchaDetector } from "./base";

export class RecaptchaDetector extends CaptchaDetector {
  readonly captchaType = "recaptcha" as const;

  // Match only the anchor (checkbox widget) iframe, not the challenge popup (/bframe).
  // reCAPTCHA v3 has no visible iframe at all, so it never emits a "seen" event.
  matchesIframe(src: string): boolean {
    return (
      (src.includes("google.com/recaptcha") || src.includes("recaptcha.net")) &&
      src.includes("/anchor")
    );
  }
}
