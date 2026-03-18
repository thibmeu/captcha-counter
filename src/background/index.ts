import { appendEvent } from "../storage";
import type { BackgroundMessage } from "../types";

chrome.runtime.onMessage.addListener((message: BackgroundMessage) => {
  if (message.type === "CAPTCHA_EVENT") {
    appendEvent(message.payload);
  }
});
