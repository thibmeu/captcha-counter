import { appendEvent } from "../storage";
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

let resetTimer: ReturnType<typeof setTimeout> | null = null;

chrome.runtime.onMessage.addListener((message: BackgroundMessage) => {
  if (message.type !== "CAPTCHA_EVENT") return;
  appendEvent(message.payload);

  const state = iconState(message.payload.event_type);
  void chrome.action.setIcon({ path: iconPaths(state) });

  // Revert to idle after 3 s so the face doesn't stay sad/happy forever
  if (resetTimer !== null) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    void chrome.action.setIcon({ path: iconPaths("idle") });
    resetTimer = null;
  }, 3000);
});
