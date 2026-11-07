import { ApiError } from "./api";

/**
 * The browser demo (a sample restaurant run in DinePOS Cloud, opened in the browser with the real billing screens).
 * API contract, as DinePOS Cloud already serves it (fine-dine `cloud/hub/src/demos.ts`):
 *   GET  /api/v1/demo  → { available, reason, demo }   the account's running demo, if any
 *   POST /api/v1/demo  → DemoView                       start one (or return the one running)
 * Until the SaaS API has these routes (404), the card says the demo is coming soon.
 */
export type DemoView = {
  slug: string;
  state: "starting" | "ready" | "failed" | "ended";
  /** Opens the billing terminal, already paired (the device token is in the fragment: never sent to a server). */
  url: string | null;
  expiresAt: number;
  staff: Array<{ name: string; pin: string }>;
};
export type DemoStatus = { available: boolean; reason: string | null; demo: DemoView | null };

export type DemoCard =
  | { kind: "ready"; demo: DemoView }
  | { kind: "start" }
  | { kind: "unavailable"; message: string };

export const DEMO_SOON = "The browser demo is coming to your account soon. Meanwhile, start the free trial on Windows.";

/** What the demo card shows for an answer from GET /api/v1/demo (or the error it failed with). */
export function demoCard(answer: DemoStatus | unknown): DemoCard {
  if (answer instanceof ApiError) return { kind: "unavailable", message: answer.status === 404 ? DEMO_SOON : answer.message };
  if (answer instanceof Error) return { kind: "unavailable", message: answer.message };
  const s = answer as DemoStatus;
  if (s?.demo?.url && s.demo.state === "ready") return { kind: "ready", demo: s.demo };
  if (s?.available) return { kind: "start" };
  return { kind: "unavailable", message: s?.reason || DEMO_SOON };
}

/** "10 Nov 2026, 6:30 pm" in India time. */
export function endsText(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
