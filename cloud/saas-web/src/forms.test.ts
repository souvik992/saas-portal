import { describe, expect, it } from "vitest";
import { checkCode, checkSignup, deviceName, formatSize, isMobile, toggleProduct, type SignupForm } from "./forms";
import { productForType, productFromQuery, RESTAURANT_TYPES, restaurantTypeOf } from "./products";
import { normalisePath } from "./router";

const ok: SignupForm = { businessName: "Spice Garden", name: "Asha Rao", email: "asha@spicegarden.in", phone: "98765 43210", password: "tandoor-2026", products: ["fine_dine"] };

describe("sign-up checks", () => {
  it("a complete form has no errors", () => {
    expect(checkSignup(ok)).toEqual({});
  });
  it("each field says what is wrong", () => {
    expect(checkSignup({ ...ok, products: [], businessName: " ", name: "", email: "asha@", phone: "12345", password: "short" })).toEqual({
      products: "Choose QSR, Fine Dine or both.",
      businessName: "Enter your business name.",
      name: "Enter your name.",
      email: "Enter a valid email address.",
      phone: "Enter a 10-digit mobile number.",
      password: "At least 8 characters.",
    });
  });
  it("Indian mobile numbers with or without +91, 0 and spaces", () => {
    for (const m of ["9876543210", "+91 98765 43210", "098765-43210", "0091 9876543210"]) expect(isMobile(m)).toBe(true);
    for (const m of ["5876543210", "987654321", "98765432100", "phone"]) expect(isMobile(m)).toBe(false);
  });
  it("the email code is 6 digits", () => {
    expect(checkCode(" 123456 ")).toBeNull();
    expect(checkCode("12345")).toMatch(/6-digit/);
  });
});

describe("product choice", () => {
  it("a click turns a product on or off; the order is QSR, then Fine Dine", () => {
    expect(toggleProduct([], "fine_dine")).toEqual(["fine_dine"]);
    expect(toggleProduct(["fine_dine"], "tiffin_qsr")).toEqual(["tiffin_qsr", "fine_dine"]);
    expect(toggleProduct(["tiffin_qsr", "fine_dine"], "tiffin_qsr")).toEqual(["fine_dine"]);
  });
  it("?product= only takes a real product", () => {
    expect(productFromQuery("tiffin_qsr")).toBe("tiffin_qsr");
    expect(productFromQuery("pizza")).toBeNull();
    expect(productFromQuery(null)).toBeNull();
  });
});

describe("helpers", () => {
  it("paths with and without a trailing slash are one page", () => {
    expect(normalisePath("/app/")).toBe("/app");
    expect(normalisePath("/")).toBe("/");
    expect(normalisePath("")).toBe("/");
  });
  it("installer sizes", () => {
    expect(formatSize(138_872_586)).toBe("132 MB");
    expect(formatSize(20_681)).toBe("20 KB");
    expect(formatSize(null)).toBe("");
  });
});

describe("deviceName", () => {
  it("names the browser and the system from a user agent", () => {
    expect(deviceName("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0")).toBe("Edge on Windows");
    expect(deviceName("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe("Chrome on Android");
    expect(deviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe("Safari on iPhone or iPad");
    expect(deviceName("")).toBe("A browser");
  });
});

describe("restaurant type", () => {
  it("fine dine picks DinePOS; QSR, tiffin, café and cloud kitchen pick Tiffin POS", () => {
    expect(RESTAURANT_TYPES.map((t) => [t.value, productForType(t.value)])).toEqual([
      ["fine_dine", "fine_dine"], ["qsr", "tiffin_qsr"], ["tiffin", "tiffin_qsr"], ["cafe", "tiffin_qsr"], ["cloud_kitchen", "tiffin_qsr"],
    ]);
  });
  it("only a listed type is accepted", () => {
    expect(restaurantTypeOf("cafe")).toBe("cafe");
    expect(restaurantTypeOf("")).toBeNull();
    expect(restaurantTypeOf("pizza")).toBeNull();
  });
});
