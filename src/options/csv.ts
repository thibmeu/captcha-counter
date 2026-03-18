import type { CaptchaEvent } from "../types";

export function esc(value: string): string {
  // RFC 4180: wrap in quotes, escape inner quotes by doubling them
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCSV(events: CaptchaEvent[]): string {
  const header = ["id", "site", "captcha_type", "event_type", "timestamp", "date"].join(",");
  const rows = events.map((e) =>
    [
      esc(e.id),
      esc(e.site),
      esc(e.captcha_type),
      esc(e.event_type),
      e.timestamp,
      esc(new Date(e.timestamp).toISOString()),
    ].join(","),
  );
  return [header, ...rows].join("\r\n");
}

export function formatSummary(events: CaptchaEvent[]): string {
  if (events.length === 0) return "No events recorded yet.";
  const oldest = new Date(Math.min(...events.map((e) => e.timestamp)));
  const date = oldest.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${events.length.toLocaleString()} event${events.length === 1 ? "" : "s"} recorded since ${date}.`;
}
