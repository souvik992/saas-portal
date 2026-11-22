// Plans and their yearly prices. Set from Petpooja's published rate card (petpooja.com/pricing, Nov 2026),
// 10% lower. Prices are per outlet, per year, before GST.

/** Petpooja's yearly price for the matching plan (₹, before tax): what ours are set from. */
export const REFERENCE_PRICES = { base: 12_000, growth: 20_000, scale: 30_000 } as const;
/** Our prices are this much below the reference. */
export const DISCOUNT = 0.1;

export type PlanCode = keyof typeof REFERENCE_PRICES;

export interface Plan {
  code: PlanCode;
  name: string;
  about: string;
  /** ₹ per outlet per year, before GST. */
  price: number;
  /** Features, after the line "Everything in <previous plan>". */
  features: string[];
  popular?: boolean;
}

/**
 * The Free plan (2026-11-22): every feature on one billing PC per product (Fine Dine: plus 1 captain phone and 1
 * kitchen screen; QSR: plus 1 kitchen screen), no bill or menu limits, for as long as the shop uses it. Every account
 * moves to it after the 30-day trial; PosiNext Cloud renews its key by itself (posinext-cloud hub/src/licences.ts).
 */
export const FREE_PLAN = {
  name: "Free",
  about: "Every feature on one billing PC, free for as long as you use it.",
  features: [
    "Fine Dine (DinePOS) or QSR (quickPOS), or both",
    "Billing with GST, KOT and UPI, works offline",
    "Captain app and kitchen display (1 each)",
    "Table QR ordering, website and app orders, Swiggy and Zomato",
    "Menu, stock, recipes, reports and backups",
    "No limit on bills, menu items or sales",
    "Help centre and email support",
  ],
} as const;

/** 10% off, rounded to the rupee. */
export const priceFrom = (reference: number) => Math.round(reference * (1 - DISCOUNT));

export const PLANS: Plan[] = [
  {
    code: "base", name: "Base", about: "More PCs, and we set it up and train your team.", price: priceFrom(REFERENCE_PRICES.base),
    features: [
      "More billing PCs, captain phones and kitchen screens",
      "Online installation and training",
      "Support by ticket and email",
    ],
  },
  {
    code: "growth", name: "Growth", about: "For busier floors, kitchens and online orders.", price: priceFrom(REFERENCE_PRICES.growth), popular: true,
    features: [
      "Captain app, kitchen display and Table QR on every device you need",
      "ODS: website, app, Swiggy and Zomato orders on one screen",
      "Installation and training: 1 visit",
    ],
  },
  {
    code: "scale", name: "Scale", about: "For high-volume outlets that want us on site.", price: priceFrom(REFERENCE_PRICES.scale),
    features: [
      "Installation and training: 2 visits",
      "Priority support",
    ],
  },
];

/** "₹10,800" */
export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
