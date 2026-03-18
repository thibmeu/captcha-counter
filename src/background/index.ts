import { appendEvent, getEvents } from "../storage";
import type { BackgroundMessage, EventType } from "../types";

function iconPaths(state: "idle" | "success" | "failure"): Record<string, string> {
  return Object.fromEntries(
    [16, 32, 48, 128].map((size) => [
      String(size),
      chrome.runtime.getURL(`icons/${state}-${size}.png`),
    ])
  );
}

function iconState(eventType: EventType): "idle" | "success" | "failure" {
  if (eventType === "success") return "success";
  if (eventType === "failure") return "failure";
  return "idle";
}

async function updateBadge(eventType: EventType): Promise<void> {
  if (eventType === "clicked") return;

  const events = await getEvents();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const count = events.filter(
    (e) => e.timestamp >= todayStart.getTime() && e.event_type === eventType,
  ).length;

  const color = eventType === "success" ? "#4A9B5F" : "#C0392B";
  void chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  void chrome.action.setBadgeBackgroundColor({ color });
}

let resetTimer: ReturnType<typeof setTimeout> | null = null;

chrome.runtime.onMessage.addListener((message: BackgroundMessage) => {
  if (message.type !== "CAPTCHA_EVENT") return;
  void appendEvent(message.payload).then(() => updateBadge(message.payload.event_type));

  const state = iconState(message.payload.event_type);
  void chrome.action.setIcon({ path: iconPaths(state) });

  // Revert to idle after 3 s so the face doesn't stay sad/happy forever
  if (resetTimer !== null) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    void chrome.action.setIcon({ path: iconPaths("idle") });
    void chrome.action.setBadgeText({ text: "" });
    resetTimer = null;
  }, 3000);
});
