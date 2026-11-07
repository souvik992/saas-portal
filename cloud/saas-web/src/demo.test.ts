import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { DEMO_SOON, demoCard, endsText } from "./demo";

const ready = { slug: "demo-ab12cd", state: "ready" as const, url: "https://demo-ab12cd.cloud.example/pos/#device=x", expiresAt: Date.UTC(2026, 10, 10, 13, 0), staff: [{ name: "Asha (Owner)", pin: "1234" }] };

describe("browser demo card", () => {
  it("shows a running demo, a start button, or why it cannot start", () => {
    expect(demoCard({ available: true, reason: null, demo: ready })).toEqual({ kind: "ready", demo: ready });
    expect(demoCard({ available: true, reason: null, demo: null })).toEqual({ kind: "start" });
    expect(demoCard({ available: false, reason: "All browser demos are in use right now.", demo: null })).toEqual({ kind: "unavailable", message: "All browser demos are in use right now." });
    expect(demoCard({ available: true, reason: null, demo: { ...ready, state: "starting", url: null } })).toEqual({ kind: "start" });
  });
  it("says coming soon while the API has no demo route, and shows other errors as they are", () => {
    expect(demoCard(new ApiError("Not found", 404, "NOT_FOUND"))).toEqual({ kind: "unavailable", message: DEMO_SOON });
    expect(demoCard(new ApiError("Unable to reach Fine Dine.", 0))).toEqual({ kind: "unavailable", message: "Unable to reach Fine Dine." });
  });
  it("prints the end time in India time", () => {
    expect(endsText(ready.expiresAt)).toMatch(/10 Nov 2026/);
  });
});
