import type { CaptchaEvent, CaptchaType, EventType } from "../types";
import { computeStats, computeStatsBySite } from "./stats";
import type { Counts } from "./stats";

const PROVIDERS: { type: CaptchaType; label: string }[] = [
  { type: "turnstile", label: "Cloudflare Turnstile" },
  { type: "recaptcha", label: "Google reCAPTCHA" },
  { type: "hcaptcha",  label: "hCaptcha" },
];

const METRICS: { event: EventType; label: string; cls: string }[] = [
  { event: "success", label: "Solved",  cls: "success" },
  { event: "failure", label: "Failed",  cls: "failure" },
];

type Range = "all" | "today" | "7d" | "30d";

function filterByRange(events: CaptchaEvent[], range: Range): CaptchaEvent[] {
  if (range === "all") return events;
  const now = Date.now();
  let cutoff: number;
  if (range === "today") {
    const d = new Date();
    cutoff = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  } else if (range === "7d") {
    cutoff = now - 7 * 24 * 60 * 60 * 1000;
  } else {
    cutoff = now - 30 * 24 * 60 * 60 * 1000;
  }
  return events.filter((e) => e.timestamp >= cutoff);
}

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

function renderSitesAccordion(events: CaptchaEvent[]): void {
  const bySite = computeStatsBySite(events);
  const accordion = document.getElementById("by-site-accordion") as HTMLElement;
  accordion.hidden = bySite.size === 0;

  const list = document.getElementById("sites-list")!;
  list.innerHTML = "";
  const entries = [...bySite.entries()]
    .sort((a, b) => (b[1].success + b[1].failure) - (a[1].success + a[1].failure));
  for (const [site, counts] of entries) {
    const li = document.createElement("li");
    li.className = "site-row";
    const name = document.createElement("span");
    name.className = "site-name";
    name.textContent = site;
    const countsEl = document.createElement("span");
    countsEl.className = "site-counts";
    countsEl.innerHTML =
      `<span class="site-success">${counts.success}✓</span>` +
      `<span class="site-failure">${counts.failure}✗</span>`;
    li.appendChild(name);
    li.appendChild(countsEl);
    list.appendChild(li);
  }
}

function renderStats(events: CaptchaEvent[]): void {
  const container = document.getElementById("stats")!;
  container.innerHTML = "";

  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML =
      `<span class="empty-icon">😶</span>` +
      `<div class="empty-title">No CAPTCHAs in this period</div>` +
      `<div class="empty-body">Browse normally and check back.</div>`;
    container.appendChild(empty);
    renderSitesAccordion([]);
    return;
  }

  const stats = computeStats(events);
  let rendered = 0;
  for (const { type, label } of PROVIDERS) {
    const counts = stats[type];
    if (counts.success + counts.failure === 0) continue;
    container.appendChild(renderSection(label, counts));
    rendered++;
  }

  if (rendered === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML =
      `<span class="empty-icon">😶</span>` +
      `<div class="empty-title">No CAPTCHAs in this period</div>` +
      `<div class="empty-body">Browse normally and check back.</div>`;
    container.appendChild(empty);
  }

  renderSitesAccordion(events);
}

async function main(): Promise<void> {
  const storageResult = await chrome.storage.local.get(["captcha_events", "popup_range"]);
  const allEvents = (storageResult["captcha_events"] as CaptchaEvent[]) ?? [];

  const rangeEl = document.getElementById("range") as HTMLSelectElement;
  const savedRange = (storageResult["popup_range"] as Range) ?? "all";
  rangeEl.value = savedRange;

  renderStats(filterByRange(allEvents, savedRange));

  rangeEl.addEventListener("change", () => {
    const range = rangeEl.value as Range;
    void chrome.storage.local.set({ popup_range: range });
    renderStats(filterByRange(allEvents, range));
  });

  const trigger = document.getElementById("by-site-trigger") as HTMLButtonElement;
  trigger.addEventListener("click", () => {
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!expanded));
    trigger.closest("#by-site-accordion")!.classList.toggle("open", !expanded);
  });

  document.getElementById("reset")?.addEventListener("click", () => {
    if (!confirm("Delete all recorded data? This cannot be undone.")) return;
    void chrome.storage.local.remove("captcha_events").then(() => {
      renderStats([]);
    });
  });
}

main();

document.getElementById("open-options")?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
