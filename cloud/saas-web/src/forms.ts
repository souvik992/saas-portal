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

export type FieldErrors = Partial<Record<keyof SignupForm | "code" | "restaurantType" | "captcha", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Indian mobile numbers: 10 digits starting 6-9, with or without +91 / 0 and spaces. */
export function isMobile(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, "").replace(/^(\+91|0091|0)/, "");
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * What a mobile field keeps as you type: digits only, at most 10. A pasted "+91 98765 43210" or "098765 43210" loses
 * its 91 / 0 prefix first, so it still fits.
 */
export function mobileDigits(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.length > 10) d = d.replace(/^(0091|91|0)/, "");
  return d.slice(0, 10);
}

/** "test" anywhere in a name, email or password (any case): this is the real portal, not a place to try things out. */
export const NOT_TESTING = "😠 This is not your testing environment.";
const looksLikeTest = (v: string) => /test/i.test(v);

export function checkSignup(f: SignupForm): FieldErrors {
  const e: FieldErrors = {};
  if (f.products.length === 0) e.products = "Choose QSR, Fine Dine or both.";
  if (!f.businessName.trim()) e.businessName = "Enter your business name.";
  else if (looksLikeTest(f.businessName)) e.businessName = NOT_TESTING;
  if (!f.name.trim()) e.name = "Enter your name.";
  else if (looksLikeTest(f.name)) e.name = NOT_TESTING;
  if (looksLikeTest(f.email)) e.email = NOT_TESTING;
  else if (!EMAIL.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (!isMobile(f.phone)) e.phone = "Enter a 10-digit mobile number.";
  if (looksLikeTest(f.password)) e.password = NOT_TESTING;
  else if (f.password.length < 8) e.password = "At least 8 characters.";
  else if (f.password.length > 200) e.password = "At most 200 characters.";
  return e;
}

export type LoginErrors = Partial<Record<"email" | "password" | "captcha", string>>;

/** Sign-in: catch typos before they count towards the 15-minute lock for wrong passwords. Every password is 8-200 characters. */
export function checkLogin(email: string, password: string): LoginErrors {
  const e: LoginErrors = {};
  if (!email.trim()) e.email = "Enter your email.";
  else if (looksLikeTest(email)) e.email = NOT_TESTING;
  else if (!EMAIL.test(email.trim())) e.email = "Enter a valid email address.";
  if (!password) e.password = "Enter your password.";
  else if (looksLikeTest(password)) e.password = NOT_TESTING;
  else if (password.length < 8) e.password = "Passwords are at least 8 characters.";
  else if (password.length > 200) e.password = "Passwords are at most 200 characters.";
  return e;
}

/** The picture captcha: 5 characters (the cloud checks them; case and spaces do not matter). */
export function checkCaptcha(answer: string): string | null {
  return answer.replace(/\s+/g, "").length === 5 ? null : "Type the 5 characters in the picture.";
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
