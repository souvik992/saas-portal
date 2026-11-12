import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The portal calls PosiNext Cloud on the same origin (/v1/...): in production the cloud serves this build on the
// portal host. In development, `npm run dev` forwards /v1 to a local cloud (cd posinext-cloud/hub && npm run dev).
const hub = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PORTAL_HUB_URL ?? "http://localhost:4900";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/v1": { target: hub, changeOrigin: false } } },
  test: { environment: "node" },
});
