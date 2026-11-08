# Fine Dine SaaS API (initial auth foundation)

This is a separate Node.js service. It does not import or modify the outlet POS server, its SQLite database, or the existing hub.

## Requirements
- Node.js 22+
- PostgreSQL 14+
- SMTP credentials for production email delivery

## Local setup
From the repository root:

```powershell
cd cloud/saas
Copy-Item .env.example .env
# Create a dedicated PostgreSQL database named finedine_saas and update DATABASE_URL.
npm install
npm run migrate
npm run dev
```

The migration runner reads the SQL files in `packages/saas-db/migrations` and records applied filenames in `saas_schema_migrations`. It takes a PostgreSQL advisory lock and applies each migration in its own transaction. Never point it at an outlet SQLite database.

In local development, email links are written to the API logger. Configure SMTP variables to test real delivery. Production startup refuses to run without SMTP credentials and an HTTPS portal URL.

## Implemented endpoints
- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/account/me`
- `PATCH /api/v1/business-profile`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/licensing/public-keys` (public): the key id and public key products should trust
- `GET /api/v1/licences`: the account's licence keys, newest first
- `POST /api/v1/outlets/:outletId/licences` (owner/admin): `{ productCode, hardwareId }` signs a key for that PC
- `POST /api/v1/licences/:licenceId/revoke` (owner/admin): `{ reason? }`

## Licence keys
Keys are made with [`packages/licensing`](../../packages/licensing/README.md) (Ed25519, checked offline by the
product). `npm run dev`, `build` and `test` build that package first (`npm run licensing`).

- Set `LICENCE_SIGNING_KEY_FILE` to the PEM private key (Fine Dine: the cloud key pair in the vendor's keygen
  folder, `keys/dinepos-cloud-signing-private.pem`, whose public half the app already trusts as `cloud`). Without it,
  issuing answers `503 LICENSING_UNAVAILABLE`. `LICENCE_SIGNING_KEY_ID` (default `cloud`) and `LICENCE_MAX_DAYS`
  (default and maximum 400) must match what the products trust.
- A key is signed from the outlet's live subscription to the product: a trial until `trial_end_at` (feature `trial`),
  a paid plan until `current_period_end`, never longer than `LICENCE_MAX_DAYS`. Seats come from the product's
  defaults, then plan entitlements, then subscription entitlements named `seats.<kind>` (Fine Dine:
  `seats.terminals`, `seats.captains`, `seats.kds`).
- Asking again for the same PC and period returns the same key. A key for another PC supersedes the outlet's earlier
  key for that product.
- `licences` rows are append-only (migration 0004 trigger): only the status of an active key may change, once.
- Revoking stops the key being shown and renewed here. A product checks keys offline, so a copy already installed
  keeps working until it ends.

Registration creates a pending owner account, organization, business profile, first on-premise outlet and a queued Windows trial provisioning job in one PostgreSQL transaction. It does not start the 14-day trial clock: the future provisioning worker must start the trial only after the hub/outlet provisioning has succeeded.

## Security notes
- Passwords use Node's built-in scrypt with per-password random salts.
- Session, verification and reset tokens are random and only their SHA-256 digests are stored.
- Verification and reset tokens are one-time and expire.
- Password reset revokes all active sessions.
- Browser sessions use HttpOnly, SameSite=Lax cookies; Secure is enabled in production.
- Login, registration, resend and reset routes have rate limits. The current rate-limit store is in-process; production deployments with multiple API instances must configure a shared Redis store before scaling horizontally.
- CORS allows only configured origins. Put the API behind TLS and a trusted reverse proxy, and set the proxy trust policy deliberately before production.
- Business tax IDs are syntax-checked only. The API does not query government registries or certify tax registration.
- Terms acceptance version is recorded in the registration audit event.

## Not yet implemented
- Customer-facing React signup/login/verification screens.
- Distributed rate-limit store and CSRF token strategy for cross-site deployments.
- Email delivery queue/retry and provider-specific templates.
- Organization team invitations and multi-organization switching.
- Trial provisioning worker and hub adapter.
- Razorpay, subscriptions and invoice generation.
- Automated integration tests against a PostgreSQL server (licence tests run on PGlite, an in-process PostgreSQL).
- Moving a licence to a new PC at most once per 30 days, and seat counting from device activations.
