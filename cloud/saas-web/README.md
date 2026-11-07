# Fine Dine customer portal

Separate React + TypeScript + Vite frontend for the SaaS account API. It does not join the repository root workspaces or alter the POS/hub runtime.

## Local development

```powershell
cd cloud/saas-web
Copy-Item .env.example .env
npm install
npm run dev
```

Set `VITE_SAAS_API_URL` to the API origin (default `http://localhost:4100`). Run the API from `cloud/saas` in a second terminal. Configure the API's `SAAS_ALLOWED_ORIGINS` to include the portal origin and keep both services on the same registrable site in production so the HttpOnly SameSite=Lax session cookie is sent.

## Routes

- `/register` — owner, business and first-outlet registration; includes terms acceptance and an `Idempotency-Key`.
- `/login` — email/password login.
- `/verify-email?token=...` — consumes the one-time verification token.
- `/forgot-password` — requests a reset email.
- `/reset-password?token=...` — sets a new password.
- `/dashboard` — account overview, the **Try it in your browser** and **Run it on your Windows PC** cards, and the business profile editor.

## Look

The account screens (everything inside `.shell`) use the DinePOS look from the desktop POS (fine-dine
`apps/desktop/src/styles.css`): warm neutrals, orange primary, Manrope for text and Fraunces for headings. The fonts are
bundled in `public/fonts` (SIL OFL), so no font CDN is needed. The marketing page (`/`, `.marketing`) keeps its own design.

## Browser demo API (to be added to the SaaS API)

The demo card calls these routes with the session cookie. Until they exist (404), it says the demo is coming soon.
The contract is the one DinePOS Cloud already serves (fine-dine `cloud/hub/src/demos.ts`), so the SaaS API can
implement it directly or by calling DinePOS Cloud:

- `GET /api/v1/demo` → `{ available: boolean, reason: string | null, demo: DemoView | null }`
- `POST /api/v1/demo` → `DemoView`, or an error: `DEMO_FULL` (all demos in use), `DEMO_LIMIT` (3 per account)

`DemoView` is `{ slug, state: "starting" | "ready" | "failed" | "ended", url, expiresAt, staff: [{ name, pin }] }`.
`url` opens the billing terminal already paired, with the device token in the `#` fragment.

The Windows trial card is instructions only. The trial starts in the POS (Settings › Licence), which today activates
against DinePOS Cloud's `/v1/activate`.

The business profile editor deliberately leaves PAN/GSTIN inputs blank and only sends replacements when entered. The API update query uses `COALESCE` for these identifiers, preserving existing values when omitted.

This portal is an initial account-management UI, not a complete billing console. Subscription checkout, outlet/device management, trial provisioning status, team management and payment history are not exposed yet.
