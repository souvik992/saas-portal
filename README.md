# SaaS Portal

A multi-product SaaS platform for restaurant businesses.

## Product catalogue

- **Tiffin / QSR** — counter service, quick billing, kitchen and inventory
- **Fine Dine** — table service, captain ordering, KOT and settlement
- **Table QR** — QR menus and table-side ordering
- **Food Ordering Website** — branded menu, checkout, delivery and pickup
- **Food Ordering App** — customer mobile ordering, notifications and tracking

## Platform foundation

The shared SaaS foundation provides account authentication, business and outlet registration, SQLite migrations (one file, the same engine as DinePOS Cloud's hub), product catalogue, product-scoped subscriptions, plan-to-product mapping, outlet product enablement and feature entitlements.

See [Multi-product platform model](docs/multi-product-platform.md) for the tenant and entitlement design.

## Current implementation status

The first migration brings across the existing customer portal and SaaS API foundation from `souvik992/fine-dine`, branch `feature/saas-foundation`. The source repository remains separate and unchanged.

The product catalogue and entitlement schema are in place. Licence keys are issued per outlet and product from the live trial or plan (`packages/licensing`, `/api/v1/.../licences`). The current registration flow still provisions a Fine Dine default subscription. Product selection during onboarding, product-specific provisioning workers, subscription checkout, the super-admin catalogue editor, and customer-facing website/mobile app provisioning are follow-on work. The repository is a foundation, not a claim that all five products are production-ready.

## Repository structure

- `cloud/saas-web` — customer-facing account portal
- `cloud/saas` — SaaS API
- `packages/saas-db/migrations` — SQLite schema migrations (applied by the API on start)
- `packages/licensing` — signed, offline-checkable licence keys for every product (Ed25519)
- `docs` — architecture and product documentation
- `.github/workflows` — API and portal CI

## Development

See the README files inside `cloud/saas` and `cloud/saas-web` for local setup, environment variables, tests and development commands.
