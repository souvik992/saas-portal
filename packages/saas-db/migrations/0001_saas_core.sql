-- SaaS platform schema, migration 0001 (SQLite, node:sqlite; the same engine as DinePOS Cloud's hub).
-- Dedicated SaaS database only: never run against an outlet or hub database.
-- Ids are UUID text made by the API. Money is integer minor units (paise). Times are UTC ISO-8601 text with
-- milliseconds ('2026-11-08T10:00:00.000Z'), so they sort and compare as text. JSON columns hold JSON text.
-- Formerly PostgreSQL migrations 0001-0003 (auth, business profile, multi-product catalogue), same tables and rules.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 160),
  email TEXT NOT NULL,
  email_normalized TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
  phone TEXT,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked', 'closed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX users_email_normalized_uq ON users(email_normalized);

CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  slug TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  billing_email TEXT,
  billing_phone TEXT,
  gstin TEXT,
  billing_address TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(billing_address)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'billing')),
  invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  joined_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX organization_members_user_idx ON organization_members(user_id);

CREATE TABLE organization_business_profiles (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE RESTRICT,
  registered_business_name TEXT,
  trade_name TEXT NOT NULL CHECK (length(trim(trade_name)) BETWEEN 1 AND 180),
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  industry TEXT NOT NULL DEFAULT 'food_service',
  pan TEXT CHECK (pan IS NULL OR pan GLOB '[A-Z][A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][A-Z]'),
  gstin TEXT CHECK (gstin IS NULL OR gstin GLOB '[0-9][0-9][A-Z][A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][A-Z][1-9A-Z]Z[0-9A-Z]'),
  cin TEXT,
  fssai_license TEXT,
  website_url TEXT,
  business_email TEXT,
  business_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  locality TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  state_code TEXT CHECK (state_code IS NULL OR length(state_code) BETWEEN 1 AND 3),
  postal_code TEXT CHECK (postal_code IS NULL OR length(trim(postal_code)) BETWEEN 3 AND 12),
  country_code TEXT NOT NULL DEFAULT 'IN' CHECK (country_code GLOB '[A-Z][A-Z]'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE outlets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  slug TEXT NOT NULL UNIQUE,
  outlet_code TEXT,
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('on_premise', 'hosted')),
  hub_store_id TEXT UNIQUE,
  hosted_instance_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  locality TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  state_code TEXT,
  postal_code TEXT,
  country_code TEXT NOT NULL DEFAULT 'IN',
  gstin TEXT,
  fssai_license TEXT,
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'active', 'suspended', 'closed', 'failed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX outlets_organization_idx ON outlets(organization_id, status);
CREATE UNIQUE INDEX outlets_org_code_uq ON outlets(organization_id, outlet_code) WHERE outlet_code IS NOT NULL;

-- Products on the platform, their features, and which products each plan and outlet has.
CREATE TABLE product_catalog (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  product_family TEXT NOT NULL CHECK (product_family IN ('operations', 'ordering')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO product_catalog (code, name, description, product_family, sort_order) VALUES
  ('tiffin_qsr', 'Tiffin / QSR', 'Quick-service restaurant billing, order and kitchen operations.', 'operations', 10),
  ('fine_dine', 'Fine Dine', 'Table service, captain ordering, kitchen tickets and settlement.', 'operations', 20),
  ('table_qr', 'Table QR', 'QR menu, table-side ordering and order status.', 'ordering', 30),
  ('ordering_web', 'Food Ordering Website', 'Branded online menu, checkout, delivery and pickup.', 'ordering', 40),
  ('ordering_app', 'Food Ordering App', 'Customer mobile ordering, payments and order tracking.', 'ordering', 50);

CREATE TABLE product_features (
  product_code TEXT NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  feature_code TEXT NOT NULL,
  enabled_by_default INTEGER NOT NULL DEFAULT 1 CHECK (enabled_by_default IN (0, 1)),
  default_quantity INTEGER CHECK (default_quantity IS NULL OR default_quantity >= 0),
  configuration_schema TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(configuration_schema)),
  PRIMARY KEY (product_code, feature_code)
);
INSERT INTO product_features (product_code, feature_code) VALUES
  ('tiffin_qsr', 'quick_billing'), ('tiffin_qsr', 'order_management'), ('tiffin_qsr', 'kitchen_display'), ('tiffin_qsr', 'inventory'),
  ('fine_dine', 'table_management'), ('fine_dine', 'captain_ordering'), ('fine_dine', 'kitchen_tickets'), ('fine_dine', 'split_settlement'),
  ('table_qr', 'digital_menu'), ('table_qr', 'qr_table_ordering'), ('table_qr', 'order_status'),
  ('ordering_web', 'branded_menu_website'), ('ordering_web', 'online_checkout'), ('ordering_web', 'delivery_pickup'),
  ('ordering_app', 'customer_mobile_app'), ('ordering_app', 'push_notifications'), ('ordering_app', 'order_tracking');

-- Deliberately no prices: the product owner approves the plan catalogue before launch.
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (length(currency) = 3),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE plan_entitlements (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  feature_code TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0),
  UNIQUE (plan_id, feature_code)
);

CREATE TABLE plan_products (
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  product_code TEXT NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  PRIMARY KEY (plan_id, product_code)
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  product_code TEXT NOT NULL DEFAULT 'fine_dine' REFERENCES product_catalog(code) ON DELETE RESTRICT,
  plan_id TEXT REFERENCES plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('provisioning', 'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  trial_start_at TEXT,
  trial_end_at TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0, 1)),
  gateway TEXT,
  gateway_customer_id TEXT,
  gateway_subscription_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (trial_end_at IS NULL OR trial_start_at IS NULL OR trial_end_at > trial_start_at),
  CHECK (current_period_end IS NULL OR current_period_start IS NULL OR current_period_end > current_period_start)
);
CREATE INDEX subscriptions_org_status_idx ON subscriptions(organization_id, status);
CREATE INDEX subscriptions_org_product_status_idx ON subscriptions(organization_id, product_code, status);
CREATE UNIQUE INDEX subscriptions_one_live_trial_per_org_product ON subscriptions(organization_id, product_code)
  WHERE status IN ('provisioning', 'trialing');

-- Feature overrides for one subscription; plan defaults stay in plan_entitlements.
CREATE TABLE subscription_entitlements (
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  feature_code TEXT NOT NULL,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (subscription_id, feature_code)
);

-- Each product turned on or off per outlet, independently of the business account.
CREATE TABLE outlet_products (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  product_code TEXT NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  configuration TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(configuration)),
  activated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (outlet_id, product_code)
);
CREATE INDEX outlet_products_org_status_idx ON outlet_products(organization_id, status, product_code);

CREATE TABLE provisioning_jobs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  job_type TEXT NOT NULL DEFAULT 'windows_trial',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'retry_wait', 'succeeded', 'failed', 'cancelled')),
  idempotency_key TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts > 0),
  next_attempt_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  lease_until TEXT,
  worker_id TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX provisioning_jobs_claim_idx ON provisioning_jobs(status, next_attempt_at) WHERE status IN ('queued', 'retry_wait');
CREATE INDEX provisioning_jobs_org_idx ON provisioning_jobs(organization_id, created_at DESC);

CREATE TABLE activation_challenges (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX activation_challenges_outlet_idx ON activation_challenges(outlet_id, expires_at) WHERE consumed_at IS NULL;

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE RESTRICT,
  gateway TEXT NOT NULL,
  gateway_order_id TEXT,
  gateway_payment_id TEXT UNIQUE,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (length(currency) = 3),
  status TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')),
  plan_snapshot TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(plan_snapshot)),
  gateway_payload TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(gateway_payload)),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX payments_org_created_idx ON payments(organization_id, created_at DESC);
CREATE UNIQUE INDEX payments_gateway_order_uq ON payments(gateway, gateway_order_id) WHERE gateway_order_id IS NOT NULL;

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  gateway TEXT NOT NULL,
  gateway_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processing', 'processed', 'failed')),
  processed_at TEXT,
  processing_error TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (gateway, gateway_event_id)
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE RESTRICT,
  payment_id TEXT REFERENCES payments(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  tax_minor INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (length(currency) = 3),
  billing_snapshot TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(billing_snapshot)),
  tax_snapshot TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(tax_snapshot)),
  pdf_object_key TEXT,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'void')),
  issued_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (total_minor = subtotal_minor + tax_minor)
);
CREATE INDEX invoices_org_issued_idx ON invoices(organization_id, issued_at DESC);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE RESTRICT,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'admin', 'system', 'worker')),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);

-- Browser identity. Token values are never stored; only SHA-256 digests.
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_seen_at TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (expires_at > created_at)
);
CREATE INDEX user_sessions_user_active_idx ON user_sessions(user_id, expires_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE user_auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (expires_at > created_at)
);
CREATE INDEX user_auth_tokens_pending_idx ON user_auth_tokens(user_id, purpose, expires_at DESC) WHERE consumed_at IS NULL;

CREATE TABLE idempotency_records (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  response_status INTEGER,
  response_body TEXT CHECK (response_body IS NULL OR json_valid(response_body)),
  completed_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (scope, idempotency_key),
  CHECK ((completed_at IS NULL) = (response_status IS NULL)),
  CHECK (expires_at > created_at)
);
CREATE INDEX idempotency_records_expiry_idx ON idempotency_records(expires_at);
