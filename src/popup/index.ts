import type { CaptchaEvent, CaptchaType } from "../types";
import { computeStats, computeStatsBySite } from "./stats";

const PROVIDERS: { type: CaptchaType; label: string }[] = [
  { type: "turnstile", label: "Cloudflare Turnstile" },
  { type: "recaptcha", label: "Google reCAPTCHA" },
  { type: "hcaptcha",  label: "hCaptcha" },
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

function renderSectionSep(label: string, withColHeaders = false): HTMLElement {
  const sep = document.createElement("div");
  sep.className = "section-sep";

  const lbl = document.createElement("span");
  lbl.className = "sep-label";
  lbl.textContent = label;
  sep.appendChild(lbl);

  if (withColHeaders) {
    const s = document.createElement("span");
    s.className = "col-label";
    s.textContent = "Solved";

    const f = document.createElement("span");
    f.className = "col-label";
    f.textContent = "Failed";

    sep.appendChild(s);
    sep.appendChild(f);
  }

  return sep;
}

function renderRow(name: string, success: number, failure: number): HTMLElement {
  const row = document.createElement("div");
  row.className = "stat-row";

  const nameEl = document.createElement("span");
  nameEl.className = "stat-name";
  nameEl.textContent = name;

  const sEl = document.createElement("span");
  sEl.className = "stat-count success";
  sEl.textContent = String(success);

  const fEl = document.createElement("span");
  fEl.className = "stat-count failure";
  fEl.textContent = String(failure);

  row.appendChild(nameEl);
  row.appendChild(sEl);
  row.appendChild(fEl);
  return row;
}

function renderStats(events: CaptchaEvent[]): void {
  const container = document.getElementById("stats")!;
  container.innerHTML = "";

  const stats = computeStats(events);
  const activeProviders = PROVIDERS.filter(
    ({ type }) => stats[type].success + stats[type].failure > 0,
  );

  if (activeProviders.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML =
      `<span class="empty-icon">😶</span>` +
      `<div class="empty-title">No CAPTCHAs in this period</div>` +
      `<div class="empty-body">Browse normally and check back.</div>`;
    container.appendChild(empty);
    return;
  }

  container.appendChild(renderSectionSep("By provider", true));

  for (const { type, label } of activeProviders) {
    const c = stats[type];
    container.appendChild(renderRow(label, c.success, c.failure));
  }

  const bySite = computeStatsBySite(events);
  if (bySite.size > 0) {
    container.appendChild(renderSectionSep("By site"));
    const top5 = [...bySite.entries()]
      .sort((a, b) => (b[1].success + b[1].failure) - (a[1].success + a[1].failure))
      .slice(0, 5);
    for (const [site, counts] of top5) {
      container.appendChild(renderRow(site, counts.success, counts.failure));
    }
  }
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
