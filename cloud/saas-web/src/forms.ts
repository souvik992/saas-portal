// Checks done in the browser before sending, so mistakes show next to the field. The cloud checks everything again.
import type { ProductCode } from "./api";

export interface SignupForm {
  businessName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  products: ProductCode[];
}

export type FieldErrors = Partial<Record<keyof SignupForm | "code" | "restaurantType", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Indian mobile numbers: 10 digits starting 6-9, with or without +91 / 0 and spaces. */
export function isMobile(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, "").replace(/^(\+91|0091|0)/, "");
  return /^[6-9]\d{9}$/.test(digits);
}

export function checkSignup(f: SignupForm): FieldErrors {
  const e: FieldErrors = {};
  if (f.products.length === 0) e.products = "Choose QSR, Fine Dine or both.";
  if (!f.businessName.trim()) e.businessName = "Enter your business name.";
  if (!f.name.trim()) e.name = "Enter your name.";
  if (!EMAIL.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (!isMobile(f.phone)) e.phone = "Enter a 10-digit mobile number.";
  if (f.password.length < 8) e.password = "At least 8 characters.";
  else if (f.password.length > 200) e.password = "At most 200 characters.";
  return e;
}

export function checkCode(code: string): string | null {
  return /^\d{6}$/.test(code.trim()) ? null : "Enter the 6-digit code from the email.";
}

/** The products picked on the sign-up page: a click turns one on or off; order follows the product list. */
export function toggleProduct(chosen: ProductCode[], p: ProductCode): ProductCode[] {
  const next = chosen.includes(p) ? chosen.filter((x) => x !== p) : [...chosen, p];
  return (["tiffin_qsr", "fine_dine"] as ProductCode[]).filter((x) => next.includes(x));
}

export function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  return bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(0)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "Chrome on Windows" from a browser's user agent (enough to recognise a device; never shown to anyone else). */
export function deviceName(ua: string): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "A browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iPhone or iPad"
    : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}
