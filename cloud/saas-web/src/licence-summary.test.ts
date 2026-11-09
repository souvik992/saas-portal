import { describe, expect, it } from "vitest";
import type { Licence } from "./api";
import { licenceSummary } from "./licence-summary";

const DAY = 86_400_000, now = Date.parse("2026-11-09T10:00:00Z");
const lic = (o: Partial<Licence>): Licence => ({ id: "x", product: "fine_dine", kind: "trial", hardwareId: "AB12-CD34", outlet: "", licensee: "", seats: { terminals: 1, captains: 0, kds: 0 }, issuedAt: now - 21 * DAY, expiresAt: now + 9 * DAY, revoked: false, key: "", ...o });

describe("licenceSummary", () => {
  it("no licence yet: the 30-day trial to come", () => {
    expect(licenceSummary([], ["fine_dine"], now)).toEqual({ kind: "none", daysLeft: 30, until: null });
  });
  it("a trial: days left (rounded up), the latest trial of the account's products", () => {
    expect(licenceSummary([lic({}), lic({ expiresAt: now + 3 * DAY - 1000 })], ["fine_dine"], now)).toMatchObject({ kind: "trial", daysLeft: 9 });
    expect(licenceSummary([lic({ product: "tiffin_qsr" })], ["fine_dine"], now).kind).toBe("none");
  });
  it("a paid licence wins over a trial; revoked and demo ones do not count", () => {
    expect(licenceSummary([lic({}), lic({ kind: "paid", expiresAt: now + 300 * DAY })], ["fine_dine"], now)).toMatchObject({ kind: "licensed", daysLeft: 300 });
    expect(licenceSummary([lic({ kind: "paid", revoked: true }), lic({ kind: "demo" })], ["fine_dine"], now).kind).toBe("none");
  });
  it("a trial that ran out: ended, 0 days", () => {
    expect(licenceSummary([lic({ expiresAt: now - DAY })], ["fine_dine"], now)).toMatchObject({ kind: "ended", daysLeft: 0 });
  });
});
