// The two products as the portal presents them. The rules (trials, keys, downloads) are PosiNext Cloud's.
import type { ProductCode } from "./api";

export interface ProductCopy {
  code: ProductCode;
  name: string;
  app: string;
  tagline: string;
  points: string[];
  addon: { name: string; about: string };
}

export const PRODUCT_COPY: Record<ProductCode, ProductCopy> = {
  tiffin_qsr: {
    code: "tiffin_qsr",
    name: "QSR",
    app: "Tiffin POS",
    tagline: "Counter service, fast. For quick-service restaurants, cafés, bakeries and cloud kitchens.",
    points: ["Quick billing with GST and UPI", "Kitchen tickets and a kitchen display", "Stock and recipes", "Works offline; backs itself up"],
    addon: { name: "ODS (online orders)", about: "Orders from your website, app, Swiggy and Zomato on one screen." },
  },
  fine_dine: {
    code: "fine_dine",
    name: "Fine Dine",
    app: "DinePOS",
    tagline: "Table service, done right. For dine-in restaurants with captains, courses and split bills.",
    points: ["Floor plan, tables, merge and move", "Captain app for phones, KOTs by station", "Split bills, reservations and waitlist", "Works offline on your outlet's PC"],
    addon: { name: "Table QR", about: "Guests order and call a waiter from a QR code on the table." },
  },
  // The retail products (PosiNext Cloud serves them since 2026-11-12). Sign-up does not offer them yet, but an account
  // can hold their licences, tickets and announcements, so every page must be able to name them.
  grocery: {
    code: "grocery",
    name: "Grocery",
    app: "PosiNext Grocery",
    tagline: "Billing and stock for grocery and kirana stores.",
    points: ["Fast barcode billing with GST and UPI", "Stock and purchases", "Works offline; backs itself up"],
    addon: { name: "Card machine", about: "Take card and UPI payments on the payment machine." },
  },
  apparel: {
    code: "apparel",
    name: "Apparel",
    app: "PosiNext Apparel",
    tagline: "Billing and stock for clothing and footwear stores.",
    points: ["Sizes and colours", "Stock and purchases", "Works offline; backs itself up"],
    addon: { name: "Card machine", about: "Take card and UPI payments on the payment machine." },
  },
  pharmacy: {
    code: "pharmacy",
    name: "Pharmacy",
    app: "PosiNext Pharmacy",
    tagline: "Billing and stock for chemists and pharmacies.",
    points: ["Batches and expiry dates", "Stock and purchases", "Works offline; backs itself up"],
    addon: { name: "Card machine", about: "Take card and UPI payments on the payment machine." },
  },
};

/** The products offered on sign-up and in My account (the restaurant products). */
export const PRODUCT_ORDER: ProductCode[] = ["tiffin_qsr", "fine_dine"];

/**
 * How to name a product the cloud sent. Never fails: a product the portal does not know yet (the cloud adds one before
 * the portal is updated) is shown by its code, so a page never breaks over a name.
 */
export function productCopy(code: string): ProductCopy {
  const known = (PRODUCT_COPY as Record<string, ProductCopy | undefined>)[code];
  if (known) return known;
  const name = code.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return { code: code as ProductCode, name, app: name, tagline: "", points: [], addon: { name: "Add-ons", about: "" } };
}

/** `?product=` from a link (e.g. "Start with QSR"), when it names a product. */
export function productFromQuery(value: string | null): ProductCode | null {
  return value === "fine_dine" || value === "tiffin_qsr" ? value : null;
}

/** The kind of restaurant chosen on the sign-up page; it picks the product (both can still be chosen). */
export type RestaurantType = "fine_dine" | "qsr" | "tiffin" | "cafe" | "cloud_kitchen";

export const RESTAURANT_TYPES: { value: RestaurantType; label: string }[] = [
  { value: "fine_dine", label: "Fine Dine" },
  { value: "qsr", label: "QSR (quick service)" },
  { value: "tiffin", label: "Tiffin" },
  { value: "cafe", label: "Café" },
  { value: "cloud_kitchen", label: "Cloud Kitchen" },
];

/** Fine dine runs DinePOS; every other kind runs Tiffin POS. */
export function productForType(type: RestaurantType): ProductCode {
  return type === "fine_dine" ? "fine_dine" : "tiffin_qsr";
}

/** A restaurant type from the select's value, or null. */
export function restaurantTypeOf(value: string): RestaurantType | null {
  return RESTAURANT_TYPES.some((t) => t.value === value) ? (value as RestaurantType) : null;
}
