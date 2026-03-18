export type CaptchaType = "turnstile" | "recaptcha" | "hcaptcha";

export type EventType = "clicked" | "success" | "failure";

export interface CaptchaEvent {
  id: string;
  site: string;
  captcha_type: CaptchaType;
  event_type: EventType;
  timestamp: number;
}

export interface BackgroundMessage {
  type: "CAPTCHA_EVENT";
  payload: CaptchaEvent;
}
