// Helpers for the Analytics page: money and change formatting, date ranges, chart scales. No drawing here.

/** Paise as rupees in the Indian grouping: 48230000 → "₹4,82,300". Paise show only under ₹100. */
export function rupees(paise: number): string {
  const r = paise / 100;
  const small = Math.abs(r) < 100 && !Number.isInteger(r);
  return `${r < 0 ? "-" : ""}₹${Math.abs(r).toLocaleString("en-IN", { minimumFractionDigits: small ? 2 : 0, maximumFractionDigits: small ? 2 : 0 })}`;
}

/** A short amount for chart axes: ₹950, ₹12.5K, ₹4.8L, ₹1.2Cr. */
export function rupeesShort(paise: number): string {
  const r = Math.abs(paise) / 100;
  const cut = (n: number) => String(Number(n.toFixed(1)));
  const s = r >= 1e7 ? `${cut(r / 1e7)}Cr` : r >= 1e5 ? `${cut(r / 1e5)}L` : r >= 1e3 ? `${cut(r / 1e3)}K` : String(Math.round(r));
  return `${paise < 0 ? "-" : ""}₹${s}`;
}

export const count = (n: number) => n.toLocaleString("en-IN");
/** Quantities come in thousandths (1500 = 1.5). */
export const qty = (milli: number) => (milli / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 });

/** Change against the earlier period, in percent; null when there is nothing to compare with. */
export function change(now: number, before: number): number | null {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

export const share = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

// ---- dates (business dates, India): plain YYYY-MM-DD strings
const DAY = 86_400_000;
const parse = (d: string) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(parse(d) + n * DAY).toISOString().slice(0, 10);
/** Today's date in India, whatever the browser's time zone. */
export const todayIST = (now = Date.now()) => new Date(now + 5.5 * 3_600_000).toISOString().slice(0, 10);

export const PRESETS = [
  { id: "today", label: "Today" }, { id: "yesterday", label: "Yesterday" }, { id: "7d", label: "Last 7 days" }, { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" }, { id: "last-month", label: "Last month" }, { id: "custom", label: "Custom dates" },
] as const;
export type PresetId = (typeof PRESETS)[number]["id"];

export function presetRange(id: Exclude<PresetId, "custom">, today: string): { from: string; to: string } {
  const monthStart = `${today.slice(0, 7)}-01`;
  switch (id) {
    case "today": return { from: today, to: today };
    case "yesterday": return { from: addDays(today, -1), to: addDays(today, -1) };
    case "7d": return { from: addDays(today, -6), to: today };
    case "30d": return { from: addDays(today, -29), to: today };
    case "month": return { from: monthStart, to: today };
    case "last-month": { const end = addDays(monthStart, -1); return { from: `${end.slice(0, 7)}-01`, to: end }; }
  }
}

export const dayLabel = (d: string, long = false) =>
  new Date(parse(d)).toLocaleDateString("en-IN", long ? { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" });
export const rangeLabel = (from: string, to: string) => (from === to ? dayLabel(from, true) : `${dayLabel(from)} – ${dayLabel(to, true).replace(/^\w+, /, "")}`);

/** 13 → "1pm", 0 → "12am". */
export const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;

/** A round top for a chart axis and its tick values (4 steps): 8730 → { max: 10000, ticks: [0, 2500, 5000, 7500, 10000] }. */
export function axis(maxValue: number): { max: number; ticks: number[] } {
  if (maxValue <= 0) return { max: 4, ticks: [0, 1, 2, 3, 4] };
  const rough = maxValue / 4, pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough)!;
  return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

/** Heatmap shade 0–5 for a cell: 0 is empty, 5 the busiest. */
export function heatLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(5, Math.max(1, Math.ceil((value / max) * 5)));
}

/** "5 minutes ago", "3 hours ago", "2 days ago". */
export function ago(at: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - at) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return `${Math.round(h / 24)} days ago`;
}

const LABELS: Record<string, string> = {
  dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery", counter: "Counter", pos: "At the outlet", website: "Your website", app: "Your app", swiggy: "Swiggy", zomato: "Zomato",
  cash: "Cash", upi: "UPI", card: "Card", wallet: "Wallet", credit: "Credit", due: "Due (pay later)", complimentary: "Complimentary", online: "Paid online", other: "Other",
};
/** A plain name for an order type, sales channel or payment mode ("" = the POS did not record it). */
export const label = (key: string) => (key === "" ? "Not recorded" : LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1));

/** Rows as a CSV file's text (values with commas or quotes are quoted). */
export const csv = (rows: Array<Array<string | number>>) =>
  rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(",")).join("\r\n");
