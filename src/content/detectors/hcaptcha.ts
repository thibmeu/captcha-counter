import { CaptchaDetector } from "./base";

export class HcaptchaDetector extends CaptchaDetector {
  readonly captchaType = "hcaptcha" as const;

  matchesIframe(src: string): boolean {
    return src.includes("newassets.hcaptcha.com") || src.includes("assets.hcaptcha.com");
  }
}
