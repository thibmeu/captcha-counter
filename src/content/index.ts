import { RecaptchaDetector } from "./detectors/recaptcha";
import { TurnstileDetector } from "./detectors/turnstile";
import { HcaptchaDetector } from "./detectors/hcaptcha";
import type { BackgroundMessage, CaptchaType, EventType } from "../types";

// Receive success/failure events from main-world.ts and forward to the background.
// "seen" and "clicked" come from the iframe detectors below.
const MSG_SOURCE = "__captcha_counter";

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data as Record<string, unknown> | null;
  if (!data?.[MSG_SOURCE]) return;
  sendEvent(data.captchaType as CaptchaType, data.outcome as EventType);
});

const detectors = [new TurnstileDetector(), new RecaptchaDetector(), new HcaptchaDetector()];

function init(): void {
  for (const detector of detectors) {
    detector.observe(document);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export function sendEvent(captchaType: CaptchaType, eventType: EventType): void {
  const message: BackgroundMessage = {
    type: "CAPTCHA_EVENT",
    payload: {
      id: crypto.randomUUID(),
      site: location.hostname,
      captcha_type: captchaType,
      event_type: eventType,
      timestamp: Date.now(),
    },
  };
  chrome.runtime.sendMessage(message);
}
