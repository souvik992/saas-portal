# Customer portal (posinext dine)

The customer portal for the restaurant products: **Fine Dine (DinePOS)** and **QSR (Tiffin POS)**. Customers sign up,
choose their product, download the Windows app and its add-ons, see their licences, and get support.

**This repository is the portal UI only.** Every backend thing (accounts, sign-in, trials, licence keys, downloads,
support tickets, announcements) is DinePOS Cloud, in [souvik992/fine-dine](https://github.com/souvik992/fine-dine)
(`cloud/hub`), which the portal calls on the same origin (`/v1/...`). See fine-dine `docs/adr/0007-one-backend-two-products.md`.

## Repository structure

- `cloud/saas-web` — the portal (React + Vite)
- `docs` — product notes
- `.github/workflows` — portal CI

## Development

See `cloud/saas-web/README.md`.
