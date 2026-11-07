# Multi-product platform model

The SaaS account is the tenant boundary. A business (organization) can have multiple outlets, and each outlet can enable multiple products. Product access is independent from the underlying POS/outlet installation.

## Product catalogue

| Product code | Customer-facing product | Primary capability |
|---|---|---|
| `tiffin_qsr` | Tiffin / QSR | Fast counter service, billing, kitchen and inventory |
| `fine_dine` | Fine Dine | Table service, captain ordering, KOT and settlement |
| `table_qr` | Table QR | QR menu and table-side ordering |
| `ordering_web` | Food Ordering Website | Branded online menu, checkout, delivery and pickup |
| `ordering_app` | Food Ordering App | Customer mobile ordering, notifications and tracking |

## Tenant and entitlement rules

- One user can belong to an organization through `organization_members`.
- One organization can own multiple outlets.
- One organization can hold separate subscriptions for different products. The `subscriptions.product_code` column scopes the subscription and its plan.
- `plan_products` records which products a commercial plan includes.
- `product_features` defines the default capability catalogue for each product.
- `outlet_products` controls which products are enabled at each outlet and stores product-specific configuration.
- `subscription_entitlements` stores subscription-level overrides; plan entitlements remain the source of plan defaults.
- Payments and invoices remain organization-scoped and can reference the relevant subscription.

## Important implementation boundary

Migration `0003_multi_product_catalog.sql` seeds the product catalogue and adds the product-scoped schema. Existing subscriptions are migrated to `fine_dine` for backward compatibility. No plan prices are seeded.

The current signup/API flow still creates the Fine Dine default subscription. Product selection during onboarding, product-specific provisioning workers, subscription checkout, customer app/web provisioning, and the super-admin catalogue editor are follow-on implementation work. The database is prepared for those workflows, but the five customer-facing products are not all provisioned by this initial portal release.
