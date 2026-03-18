import { describe, it, expect } from "vitest";
import { esc, toCSV, formatSummary } from "../options/csv";
import type { CaptchaEvent } from "../types";

function event(overrides: Partial<CaptchaEvent> = {}): CaptchaEvent {
  return {
    id: "test-id",
    site: "example.com",
    captcha_type: "turnstile",
    event_type: "success",
    timestamp: 1700000000000,
    ...overrides,
  };
}

describe("esc", () => {
  it("wraps a plain string in double quotes", () => {
    expect(esc("hello")).toBe('"hello"');
  });

  it("doubles inner double quotes (RFC 4180)", () => {
    expect(esc('say "hi"')).toBe('"say ""hi"""');
  });

  it("handles an empty string", () => {
    expect(esc("")).toBe('""');
  });

  it("handles a string that is only quotes", () => {
    expect(esc('""')).toBe('""""""'); // open + "" + "" + close = 6 chars
  });
});

describe("toCSV", () => {
  it("starts with the correct header row", () => {
    const csv = toCSV([]);
    expect(csv).toBe("id,site,captcha_type,event_type,timestamp,date");
  });

  it("uses CRLF as the line separator", () => {
    const csv = toCSV([event()]);
    expect(csv).toContain("\r\n");
    expect(csv.split("\r\n")).toHaveLength(2); // header + 1 row
  });

  it("quotes all string fields", () => {
    const csv = toCSV([event({ id: "abc", site: "foo.com" })]);
    const row = csv.split("\r\n")[1];
    expect(row).toMatch(/^"abc","foo\.com"/);
  });

  it("writes the numeric timestamp unquoted", () => {
    const csv = toCSV([event({ timestamp: 1700000000000 })]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain(",1700000000000,");
  });

  it("escapes double quotes inside field values", () => {
    const csv = toCSV([event({ site: 'evil"site.com' })]);
    expect(csv).toContain('"evil""site.com"');
  });
});

describe("formatSummary", () => {
  it("returns a placeholder when no events exist", () => {
    expect(formatSummary([])).toBe("No events recorded yet.");
  });

  it("uses singular 'event' for exactly one event", () => {
    expect(formatSummary([event()])).toMatch(/^1 event recorded since/);
  });

  it("uses plural 'events' for more than one", () => {
    expect(formatSummary([event(), event()])).toMatch(/^2 events recorded since/);
  });

  it("bases the date on the oldest event", () => {
    const older = event({ timestamp: 1000000000000 }); // 2001-09-09
    const newer = event({ timestamp: 1700000000000 }); // 2023
    const summary = formatSummary([newer, older]);
    // The date should come from the older timestamp — just verify it doesn't
    // use the newer timestamp's year as the only year mentioned.
    expect(summary).toContain("2001");
  });
});
