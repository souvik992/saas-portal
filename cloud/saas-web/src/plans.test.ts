import { describe, expect, it } from "vitest";
import { PLANS, REFERENCE_PRICES, rupees } from "./plans";

describe("plans", () => {
  it("are 10% below the reference prices", () => {
    expect(PLANS.map((p) => [p.code, p.price])).toEqual([["base", 10_800], ["growth", 18_000], ["scale", 27_000]]);
    for (const p of PLANS) expect(p.price).toBe(REFERENCE_PRICES[p.code] * 0.9);
  });
  it("show prices in Indian format", () => {
    expect(rupees(10_800)).toBe("₹10,800");
    expect(rupees(1_00_000)).toBe("₹1,00,000");
  });
});
