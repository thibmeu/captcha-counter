import type { CaptchaEvent, CaptchaType, EventType } from "../types";

export type Counts = Record<EventType, number>;
export type Stats  = Record<CaptchaType, Counts>;

export function computeStats(events: CaptchaEvent[]): Stats {
  const stats: Stats = {
    turnstile: { clicked: 0, success: 0, failure: 0 },
    recaptcha:  { clicked: 0, success: 0, failure: 0 },
    hcaptcha:   { clicked: 0, success: 0, failure: 0 },
  };
  for (const e of events) {
    stats[e.captcha_type][e.event_type]++;
  }
  return stats;
}

export function computeStatsBySite(
  events: CaptchaEvent[],
): Map<string, { success: number; failure: number }> {
  const map = new Map<string, { success: number; failure: number }>();
  for (const e of events) {
    if (e.event_type === "clicked") continue;
    const entry = map.get(e.site) ?? { success: 0, failure: 0 };
    entry[e.event_type]++;
    map.set(e.site, entry);
  }
  return map;
}
