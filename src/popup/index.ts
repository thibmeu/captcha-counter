import type { CaptchaEvent, CaptchaType, EventType } from "../types";
import { computeStats } from "./stats";
import type { Counts } from "./stats";

const PROVIDERS: { type: CaptchaType; label: string }[] = [
  { type: "turnstile", label: "Cloudflare Turnstile" },
  { type: "recaptcha", label: "Google reCAPTCHA" },
];

const METRICS: { event: EventType; label: string; cls: string }[] = [
  { event: "clicked", label: "Clicked", cls: "" },
  { event: "success", label: "Solved",  cls: "success" },
  { event: "failure", label: "Failed",  cls: "failure" },
];

function renderSection(label: string, counts: Counts): HTMLElement {
  const total = counts.success + counts.failure;
  const rate  = total > 0 ? Math.round((counts.success / total) * 100) : null;

  const section = document.createElement("section");

  const providerLabel = document.createElement("div");
  providerLabel.className = "provider-label";
  providerLabel.textContent = label;
  section.appendChild(providerLabel);

  const metrics = document.createElement("div");
  metrics.className = "metrics";
  for (const { event, label: metricLabel, cls } of METRICS) {
    const col = document.createElement("div");
    col.className = `metric${cls ? ` ${cls}` : ""}`;

    const val = document.createElement("div");
    val.className = "metric-value";
    val.textContent = String(counts[event]);

    const lbl = document.createElement("div");
    lbl.className = "metric-label";
    lbl.textContent = metricLabel;

    col.appendChild(val);
    col.appendChild(lbl);
    metrics.appendChild(col);
  }
  section.appendChild(metrics);

  if (rate !== null) {
    const row = document.createElement("div");
    row.className = "rate-row";

    const track = document.createElement("div");
    track.className = "rate-track";
    const fill = document.createElement("div");
    fill.className = "rate-fill";
    fill.style.width = `${rate}%`;
    track.appendChild(fill);

    const pct = document.createElement("div");
    pct.className = "rate-pct";
    pct.textContent = `${rate}%`;

    row.appendChild(track);
    row.appendChild(pct);
    section.appendChild(row);
  }

  return section;
}

async function main(): Promise<void> {
  const result = await chrome.storage.local.get("captcha_events");
  const events = (result["captcha_events"] as CaptchaEvent[]) ?? [];

  const container = document.getElementById("stats")!;

  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML =
      `<span class="empty-icon">😶</span>` +
      `<div class="empty-title">No CAPTCHAs recorded yet</div>` +
      `<div class="empty-body">Browse normally and check back.</div>`;
    container.appendChild(empty);
    return;
  }

  const stats = computeStats(events);
  for (const { type, label } of PROVIDERS) {
    container.appendChild(renderSection(label, stats[type]));
  }
}

main();

document.getElementById("open-options")?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
