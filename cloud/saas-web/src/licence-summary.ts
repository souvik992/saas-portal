// What the dashboard's licence card says, from the account's licences (GET /v1/account/licences).
import type { Licence, ProductCode } from "./api";

export const TRIAL_DAYS = 30;

/**
 * What the licence card on the dashboard says, from the account's licences: a paid (or hand-made) licence wins, then
 * the Free plan (every feature on one PC; PosiNext Cloud moves a trial to it before the trial ends), then a trial.
 */
export function licenceSummary(licences: Licence[], products: ProductCode[], now = Date.now()):
  { kind: "none" | "trial" | "ended" | "free" | "licensed"; daysLeft: number; until: number | null } {
  const mine = licences.filter((l) => !l.revoked && products.includes(l.product) && l.kind !== "demo");
  const live = mine.filter((l) => l.expiresAt > now);
  const latest = (ls: Licence[]) => { const end = Math.max(...ls.map((l) => l.expiresAt)); return { daysLeft: daysLeftOf(end, now), until: end }; };
  const paid = live.filter((l) => l.kind === "paid" || l.kind === "manual");
  if (paid.length) return { kind: "licensed", ...latest(paid) };
  const free = live.filter((l) => l.kind === "free");
  if (free.length) return { kind: "free", ...latest(free) };
  const trials = live.filter((l) => l.kind === "trial");
  if (trials.length) return { kind: "trial", ...latest(trials) };
  return mine.length ? { kind: "ended", daysLeft: 0, until: Math.max(...mine.map((l) => l.expiresAt)) } : { kind: "none", daysLeft: TRIAL_DAYS, until: null };
}
const daysLeftOf = (end: number, now: number) => Math.max(0, Math.ceil((end - now) / 86_400_000));

/** "2 terminals, 1 captain, 1 kitchen": only the kinds of seat that product has (retail products have terminals only). */
export function seatsText(l: Pick<Licence, "product" | "seats">): string {
  const s: Partial<Licence["seats"]> = l.seats ?? {};
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const parts = [`${n(s.terminals)} terminal${n(s.terminals) === 1 ? "" : "s"}`];
  if (l.product === "fine_dine") parts.push(`${n(s.captains)} captain`, `${n(s.kds)} kitchen`);
  else if (l.product === "tiffin_qsr") parts.push(`${n(s.kds)} kitchen`);
  return parts.join(", ");
}
