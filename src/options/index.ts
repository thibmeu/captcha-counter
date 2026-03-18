import type { CaptchaEvent } from "../types";
import { toCSV, formatSummary } from "./csv";

// ── Storage ───────────────────────────────────────────────────────────────────

async function load(): Promise<CaptchaEvent[]> {
  const result = await chrome.storage.local.get("captcha_events");
  return (result["captcha_events"] as CaptchaEvent[]) ?? [];
}

// ── Download ──────────────────────────────────────────────────────────────────

function download(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
