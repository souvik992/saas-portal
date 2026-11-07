# SaaS Portal

A multi-product SaaS platform for restaurant businesses.

## Supported products

- Tiffin / QSR
- Fine Dine
- Table QR ordering
- Food ordering website
- Food ordering mobile app

## Platform foundation

This repository contains the shared SaaS account portal and backend foundation. Product entitlements, subscriptions, billing, business and outlet management, roles, and product-specific configuration will be developed as shared platform capabilities.

## Initial migration

The initial portal and API foundation is being migrated from `souvik992/fine-dine` (branch `feature/saas-foundation`) into this standalone repository. The source repository remains independent.

## Structure

- `cloud/saas-web` — customer-facing SaaS portal
- `cloud/saas` — SaaS API and database migrations
- `.github/workflows` — CI workflows

## Development

See the README files inside `cloud/saas` and `cloud/saas-web` for setup, environment variables, tests, and local development.
