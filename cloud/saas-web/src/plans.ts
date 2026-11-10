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

/** 10% off, rounded to the rupee. */
export const priceFrom = (reference: number) => Math.round(reference * (1 - DISCOUNT));

export const PLANS: Plan[] = [
  {
    code: "base", name: "Base", about: "Billing, menu, stock and reports for one outlet.", price: priceFrom(REFERENCE_PRICES.base),
    features: [
      "Fine Dine (DinePOS) or QSR (Tiffin POS)",
      "Billing with GST and UPI, works offline",
      "Menu management, stock and recipes",
      "Reports and automatic backups",
      "Online installation and training",
      "Support by ticket and email",
    ],
  },
  {
    code: "growth", name: "Growth", about: "Add-ons for busier floors and kitchens.", price: priceFrom(REFERENCE_PRICES.growth), popular: true,
    features: [
      "Captain app for waiters' phones",
      "Kitchen display",
      "Table QR ordering and waiter calling",
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
