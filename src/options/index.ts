import type { CaptchaEvent } from "../types";

// ── Storage ───────────────────────────────────────────────────────────────────

async function load(): Promise<CaptchaEvent[]> {
  const result = await chrome.storage.local.get("captcha_events");
  return (result["captcha_events"] as CaptchaEvent[]) ?? [];
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function esc(value: string): string {
  // RFC 4180: wrap in quotes, escape inner quotes by doubling them
  return `"${value.replace(/"/g, '""')}"`;
}

function toCSV(events: CaptchaEvent[]): string {
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

function download(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Summary ───────────────────────────────────────────────────────────────────

function formatSummary(events: CaptchaEvent[]): string {
  if (events.length === 0) return "No events recorded yet.";
  const oldest = new Date(Math.min(...events.map((e) => e.timestamp)));
  const date = oldest.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${events.length.toLocaleString()} event${events.length === 1 ? "" : "s"} recorded since ${date}.`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const events = await load();

  const summary = document.getElementById("summary")!;
  const exportBtn = document.getElementById("export") as HTMLButtonElement;
  const clearBtn = document.getElementById("clear") as HTMLButtonElement;

  summary.textContent = formatSummary(events);
  exportBtn.disabled = events.length === 0;
  clearBtn.disabled = events.length === 0;

  exportBtn.addEventListener("click", () => {
    const date = new Date().toISOString().slice(0, 10);
    download(toCSV(events), `captcha-events-${date}.csv`);
  });

  clearBtn.addEventListener("click", async () => {
    if (!confirm(`Delete all ${events.length} events? This cannot be undone.`)) return;
    await chrome.storage.local.remove("captcha_events");
    summary.textContent = "No events recorded yet.";
    exportBtn.disabled = true;
    clearBtn.disabled = true;
  });
}

main();
