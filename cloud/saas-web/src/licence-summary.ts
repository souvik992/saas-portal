// What the dashboard's licence card says, from the account's licences (GET /v1/account/licences).
import type { Licence, ProductCode } from "./api";

export const TRIAL_DAYS = 30;

/** What the licence card on the dashboard says, from the account's licences. */
export function licenceSummary(licences: Licence[], products: ProductCode[], now = Date.now()):
  { kind: "none" | "trial" | "ended" | "licensed"; daysLeft: number; until: number | null } {
  const mine = licences.filter((l) => !l.revoked && products.includes(l.product) && l.kind !== "demo");
  const live = mine.filter((l) => l.expiresAt > now);
  const paid = live.filter((l) => l.kind !== "trial");
  if (paid.length) return { kind: "licensed", daysLeft: daysLeftOf(Math.max(...paid.map((l) => l.expiresAt)), now), until: Math.max(...paid.map((l) => l.expiresAt)) };
  const trials = live.filter((l) => l.kind === "trial");
  if (trials.length) { const end = Math.max(...trials.map((l) => l.expiresAt)); return { kind: "trial", daysLeft: daysLeftOf(end, now), until: end }; }
  return mine.length ? { kind: "ended", daysLeft: 0, until: Math.max(...mine.map((l) => l.expiresAt)) } : { kind: "none", daysLeft: TRIAL_DAYS, until: null };
}
const daysLeftOf = (end: number, now: number) => Math.max(0, Math.ceil((end - now) / 86_400_000));
