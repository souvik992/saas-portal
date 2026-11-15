import { describe, expect, it } from "vitest";
import { seatsText } from "./licence-summary";
import { PRODUCT_COPY, PRODUCT_ORDER, productCopy } from "./products";

// The Licences page crashed for an account holding a key for a product the portal did not know (Grocery): every
// product the cloud sends must have a name, and an unknown one must never break a page.

describe("products", () => {
  it("names every product PosiNext Cloud serves", () => {
    for (const code of ["fine_dine", "tiffin_qsr", "grocery", "apparel", "pharmacy"]) {
      expect(productCopy(code)).toBe(PRODUCT_COPY[code as keyof typeof PRODUCT_COPY]);
      expect(productCopy(code).app.length).toBeGreaterThan(0);
    }
    expect(productCopy("pharmacy").app).toBe("PosiNext Pharmacy");
  });

  it("names a product it does not know yet by its code instead of failing", () => {
    expect(productCopy("hardware_store")).toMatchObject({ name: "Hardware store", app: "Hardware store" });
    expect(productCopy("").name).toBe("");
  });

  it("sign-up still offers the restaurant products only", () => {
    expect(PRODUCT_ORDER).toEqual(["tiffin_qsr", "fine_dine"]);
  });

  it("shows only the seats a product has", () => {
    const seats = { terminals: 2, captains: 1, kds: 1 };
    expect(seatsText({ product: "fine_dine", seats })).toBe("2 terminals, 1 captain, 1 kitchen");
    expect(seatsText({ product: "tiffin_qsr", seats })).toBe("2 terminals, 1 kitchen");
    expect(seatsText({ product: "grocery", seats: { ...seats, terminals: 1 } })).toBe("1 terminal");
    expect(seatsText({ product: "grocery", seats: undefined as never })).toBe("0 terminals");
  });
});
