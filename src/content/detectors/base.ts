import { sendEvent } from "../index";
import type { CaptchaType } from "../../types";

export abstract class CaptchaDetector {
  abstract readonly captchaType: CaptchaType;
  abstract matchesIframe(src: string): boolean;

  private readonly seenIframes = new WeakSet<HTMLIFrameElement>();

  observe(root: Document): void {
    for (const iframe of root.querySelectorAll<HTMLIFrameElement>("iframe")) {
      this.checkIframe(iframe);
    }

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLIFrameElement) {
              this.checkIframe(node);
            } else if (node instanceof Element) {
              for (const iframe of node.querySelectorAll<HTMLIFrameElement>("iframe")) {
                this.checkIframe(iframe);
              }
            }
          }
        } else if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLIFrameElement
        ) {
          this.checkIframe(mutation.target);
        }
      }
    }).observe(root.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  private checkIframe(iframe: HTMLIFrameElement): void {
    if (this.seenIframes.has(iframe)) return;
    const src = iframe.getAttribute("src") ?? "";
    if (!src || !this.matchesIframe(src)) return;

    this.seenIframes.add(iframe);

    // "clicked": fire when the user clicks into the iframe.
    // Cross-origin iframes don't propagate click events to the parent, but clicking
    // into one transfers focus to the iframe element, which fires a bubbling focusin.
    iframe.addEventListener("focusin", () => sendEvent(this.captchaType, "clicked"), {
      once: true,
    });
  }
}
