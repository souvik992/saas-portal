// The two products as the portal presents them. The rules (trials, keys, downloads) are DinePOS Cloud's.
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
};

export const PRODUCT_ORDER: ProductCode[] = ["tiffin_qsr", "fine_dine"];

/** `?product=` from a link (e.g. "Start with QSR"), when it names a product. */
export function productFromQuery(value: string | null): ProductCode | null {
  return value === "fine_dine" || value === "tiffin_qsr" ? value : null;
}
