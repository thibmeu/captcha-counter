import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CaptchaEvent } from "../types";

// ── In-memory chrome.storage.local mock ───────────────────────────────────────

let store: Record<string, unknown> = {};

beforeEach(() => {
  store = {};
  vi.mocked(chrome.storage.local.get).mockImplementation(async (key: unknown) => {
    const k = key as string;
    return { [k]: store[k] };
  });
  vi.mocked(chrome.storage.local.set).mockImplementation(async (obj: unknown) => {
    Object.assign(store, obj as Record<string, unknown>);
  });
  vi.mocked(chrome.storage.local.remove).mockImplementation(async (key: unknown) => {
    delete store[key as string];
  });
});

// Import after mock setup so the module sees the configured chrome global.
const { appendEvent, getEvents, clearEvents } = await import("../storage");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CaptchaEvent> = {}): CaptchaEvent {
  return {
    id: crypto.randomUUID(),
    site: "example.com",
    captcha_type: "turnstile",
    event_type: "success",
    timestamp: Date.now(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getEvents", () => {
  it("returns an empty array when storage is empty", async () => {
    expect(await getEvents()).toEqual([]);
  });

  it("returns stored events", async () => {
    const e = makeEvent();
    store["captcha_events"] = [e];
    expect(await getEvents()).toEqual([e]);
  });
});

describe("appendEvent", () => {
  it("stores the first event", async () => {
    const e = makeEvent();
    await appendEvent(e);
    expect(await getEvents()).toEqual([e]);
  });

  it("appends to existing events without overwriting", async () => {
    const e1 = makeEvent();
    const e2 = makeEvent({ site: "other.com" });
    await appendEvent(e1);
    await appendEvent(e2);
    expect(await getEvents()).toEqual([e1, e2]);
  });
});

describe("clearEvents", () => {
  it("removes all events from storage", async () => {
    const e = makeEvent();
    await appendEvent(e);
    await clearEvents();
    expect(await getEvents()).toEqual([]);
  });
});
