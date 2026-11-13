// PosiNext Cloud's API on the same origin (/v1/...). The session is an HttpOnly cookie the cloud sets; this code never
// sees it. Errors come back as { error: { code, message, details } }.

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;
  readonly details: Record<string, unknown>;
  constructor(message: string, status: number, code: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.fields = (details.fields as Record<string, string> | undefined) ?? {};
  }
}

export async function api<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? null : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("We could not reach the server. Check your internet connection and try again.", 0, "OFFLINE");
  }
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const e = (json as { error?: { code?: string; message?: string; details?: Record<string, unknown> } } | null)?.error;
    throw new ApiError(e?.message ?? "Something went wrong. Please try again.", res.status, e?.code ?? "ERROR", e?.details ?? {});
  }
  return json as T;
}

export type ProductCode = "fine_dine" | "tiffin_qsr";

export interface Me {
  user: { id: string; name: string; email: string; role: "owner" | "admin" | "billing" };
  account: { id: string; name: string; phone: string; gstin: string | null; status: string; createdAt: number; products: ProductCode[] };
  stores: Array<{ slug: string; name: string }>;
}

export interface Download {
  id: string; product: ProductCode; productName: string; app: string; kind: "app" | "addon"; name: string; description: string;
  available: boolean; version: string | null; fileName: string | null; size: number | null; publishedAt: string | null; build: string | null;
}

export interface Licence {
  id: string; product: ProductCode; kind: "trial" | "paid" | "manual" | "demo"; hardwareId: string; outlet: string; licensee: string;
  seats: { terminals: number; captains: number; kds: number }; issuedAt: number; expiresAt: number; revoked: boolean; key: string;
}

export interface TicketMessage { id: string; from: "customer" | "staff"; name: string; body: string; at: number }
export interface Ticket {
  id: string; number: number; subject: string; product: ProductCode | null; status: "open" | "answered" | "closed";
  createdAt: number; updatedAt: number; messages?: TicketMessage[];
}
export interface Announcement { id: string; title: string; body: string; product: ProductCode | null; publishedAt: number }
export interface Article { slug: string; title: string; body: string; category: string; product: ProductCode | null; updatedAt: number }
export interface Status { ok: boolean; checkedAt: number; components: Array<{ name: string; status: "ok" | "degraded" | "down"; note: string }> }

export const support = {
  tickets: () => api<{ tickets: Ticket[] }>("GET", "/v1/account/tickets"),
  ticket: (id: string) => api<Ticket>("GET", `/v1/account/tickets/${encodeURIComponent(id)}`),
  open: (b: { subject: string; product: ProductCode | null; body: string }) => api<Ticket>("POST", "/v1/account/tickets", b),
  reply: (id: string, body: string) => api<Ticket>("POST", `/v1/account/tickets/${encodeURIComponent(id)}/reply`, { body }),
  close: (id: string) => api<Ticket>("POST", `/v1/account/tickets/${encodeURIComponent(id)}/close`),
  announcements: () => api<{ announcements: Announcement[] }>("GET", "/v1/announcements"),
  articles: () => api<{ articles: Array<Omit<Article, "body">> }>("GET", "/v1/kb"),
  article: (slug: string) => api<Article>("GET", `/v1/kb/${encodeURIComponent(slug)}`),
  status: () => api<Status>("GET", "/v1/status"),
};

export const account = {
  signup: (b: { businessName: string; name: string; email: string; phone: string; password: string; products: ProductCode[] }) =>
    // verify: false when the cloud does not ask for the emailed code (HUB_SKIP_EMAIL_VERIFY): already signed in
    api<{ email: string; verify: boolean }>("POST", "/v1/account/signup", b),
  verify: (email: string, code: string) => api<{ ok: true }>("POST", "/v1/account/verify", { email, code }),
  resend: (email: string) => api<{ ok: true }>("POST", "/v1/account/resend", { email }),
  login: (email: string, password: string) => api<{ ok: true }>("POST", "/v1/account/login", { email, password }),
  logout: () => api<{ ok: true }>("POST", "/v1/account/logout"),
  me: () => api<Me>("GET", "/v1/account/me"),
  forgot: (email: string) => api<{ ok: true }>("POST", "/v1/account/forgot", { email }),
  reset: (email: string, code: string, password: string) => api<{ ok: true }>("POST", "/v1/account/reset", { email, code, password }),
  changePassword: (current: string, password: string) => api<{ ok: true }>("POST", "/v1/account/password", { current, password }),
  setProducts: (products: ProductCode[]) => api<{ products: ProductCode[] }>("POST", "/v1/account/products", { products }),
  downloads: () => api<{ downloads: Download[] }>("GET", "/v1/downloads"),
  licences: () => api<{ licences: Licence[] }>("GET", "/v1/account/licences"),
  sessions: () => api<{ sessions: SignIn[] }>("GET", "/v1/account/sessions"),
  revokeSession: (id: string) => api<{ ok: true }>("POST", `/v1/account/sessions/${encodeURIComponent(id)}/revoke`),
  revokeOtherSessions: () => api<{ ok: true; signedOut: number }>("POST", "/v1/account/sessions/revoke-others"),
};

// ---- sales analytics (GET /v1/account/analytics; amounts in paise, dates are business dates in India)
export interface SalesTotals { sales: number; orders: number; avgTicket: number; tax: number; discount: number; covers: number; voids: number; voidAmount: number; refunds: number; refundAmount: number }
export interface Analytics {
  range: { from: string; to: string; days: number };
  previous: { from: string; to: string };
  filters: {
    brands: Array<{ slug: string; name: string }>;
    stores: Array<{ slug: string; name: string; product: string | null; brand: string | null; lastSyncAt: number | null }>;
    terminals: Array<{ store: string; name: string }>;
  };
  totals: SalesTotals;
  previousTotals: SalesTotals;
  daily: Array<{ date: string; sales: number; orders: number }>;
  /** dow: 0 = Sunday; hour: 0-23 */
  hours: Array<{ dow: number; hour: number; orders: number; sales: number }>;
  topItems: Array<{ name: string; category: string; qtyMilli: number; amount: number }>;
  categories: Array<{ name: string; qtyMilli: number; amount: number }>;
  itemTotals: { qtyMilli: number; amount: number };
  /** "" = the POS build did not record it */
  orderTypes: Array<{ type: string; orders: number; sales: number }>;
  channels: Array<{ channel: string; orders: number; sales: number }>;
  payments: Array<{ mode: string; amount: number }>;
  outlets: Array<{ slug: string; name: string; product: string | null; brand: string | null; brandName: string | null; lastSyncAt: number | null; sales: number; orders: number; avgTicket: number; previousSales: number }>;
  terminals: Array<{ store: string; storeName: string; name: string; sales: number; orders: number; avgTicket: number }>;
  recorded: { items: boolean; orderTypes: boolean; terminals: boolean };
  lastSyncAt: number | null;
  generatedAt: number;
}
export const analytics = (q: { from: string; to: string; brand?: string; store?: string; terminal?: string }) => {
  const p = new URLSearchParams({ from: q.from, to: q.to });
  if (q.brand) p.set("brand", q.brand);
  if (q.store) p.set("store", q.store);
  if (q.terminal) p.set("terminal", q.terminal);
  return api<Analytics>("GET", `/v1/account/analytics?${p}`);
};

/** A device signed in to the portal (`id` is a short reference, not the sign-in itself). */
export interface SignIn { id: string; createdAt: number; lastUsedAt: number; userAgent: string; current: boolean }

/** The link that starts a download (the cloud records it, then sends the installer). */
export const downloadHref = (id: string) => `/v1/account/downloads/${encodeURIComponent(id)}`;
