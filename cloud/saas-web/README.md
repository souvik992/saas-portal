# Customer portal

The customer portal for **QSR (Tiffin POS)** and **Fine Dine (DinePOS)**, in the POSINEXT look (orange,
Rubik, white cards; the client-area design at welcome-desk-designs.lovable.app). React + Vite, no backend of its own: every call goes to **PosiNext Cloud** (repository posinext-cloud, `hub/`) on the
same origin (`/v1/...`), which also sets the HttpOnly session cookie. See fine-dine `docs/adr/0007-one-backend-two-products.md`.

## Develop

```powershell
# 1. a local PosiNext Cloud (codes are printed in its window)
cd posinext-cloud/hub
npm run dev
# 2. the portal (forwards /v1 to http://localhost:4900; PORTAL_HUB_URL to change it)
cd saas-portal/cloud/saas-web
npm install
npm run dev
```

`npm test` (vitest: form checks and helpers), `npm run build` (typecheck + `dist/`).

## Pages

| Path | |
|---|---|
| `/` (also `/login`) | Sign in (`?next=/app/...`); an unconfirmed email goes to the code step. Signed in: straight to the dashboard |
| `/register` (`?product=fine_dine` or `tiffin_qsr`) | Restaurant type (Fine Dine picks DinePOS; QSR, Tiffin, Café, Cloud Kitchen pick Tiffin POS), product choice and details, then the 6-digit email code |
| `/forgot` | Email code, then a new password |
| `/app/...` | Client area (signed in) |
| `/app/inventory` | Purchases and stock, view only (`pages/Inventory.tsx`): stock value, materials running low, purchases by day, supplier and material, food cost against sales, stock by outlet, one outlet's stock list, recent purchases. Entered in the POS at each outlet |
| `/app/analytics` | Sales analytics for the account's outlets: dates, brand, outlet and terminal filters; totals against the period before, daily sales, peak hours, top items, order types, payments, outlets and terminals (`pages/Analytics.tsx`; charts are hand-drawn SVG and CSS, no chart library) |

## Hosting

PosiNext Cloud serves the built `dist/` on the portal host, so the API is on the same origin (fine-dine roadmap P8-09).

Sign-in and sign-up pages show a photo beside the form (`public/auth/`, free photos from Unsplash under the Unsplash licence; sign-up shows a restaurant bar). The photo scrolls with the page and stretches to the height of the form; the page message sits at the top of the photo. Sign in and forgot password put the photo (message at the bottom) and the form in one card that fills the screen; sign up uses the same card, growing with its longer form (message at the top). Sign in, sign up and forgot password show no top bar.
