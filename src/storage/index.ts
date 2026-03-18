import type { CaptchaEvent } from "../types";

const STORAGE_KEY = "captcha_events";

export async function appendEvent(event: CaptchaEvent): Promise<void> {
  const events = await getEvents();
  events.push(event);
  await chrome.storage.local.set({ [STORAGE_KEY]: events });
}

export async function getEvents(): Promise<CaptchaEvent[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as CaptchaEvent[]) ?? [];
}

export async function clearEvents(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
