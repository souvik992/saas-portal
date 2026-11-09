# Customer portal

The customer portal for **QSR (Tiffin POS)** and **Fine Dine (DinePOS)**, in the POSINEXT look (orange,
Rubik, white cards; the client-area design at welcome-desk-designs.lovable.app). React + Vite, no backend of its own: every call goes to **DinePOS Cloud** (fine-dine `cloud/hub`) on the
same origin (`/v1/...`), which also sets the HttpOnly session cookie. See fine-dine `docs/adr/0007-one-backend-two-products.md`.

## Develop

```powershell
# 1. a local DinePOS Cloud (codes are printed in its window)
cd fine-dine/cloud/hub
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

## Hosting

DinePOS Cloud serves the built `dist/` on the portal host, so the API is on the same origin (fine-dine roadmap P8-09).

Sign-in and sign-up pages show a photo beside the form (`public/auth/`, free photos from Unsplash under the Unsplash licence; sign-up shows a restaurant bar). The photo scrolls with the page and stretches to the height of the form.
