-- Multi-product catalog and outlet entitlements for the restaurant SaaS platform.
-- PostgreSQL SaaS database only.

CREATE TABLE IF NOT EXISTS product_catalog (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  product_family text NOT NULL CHECK (product_family IN ('operations', 'ordering')),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO product_catalog(code, name, description, product_family, sort_order) VALUES
  ('tiffin_qsr', 'Tiffin / QSR', 'Quick-service restaurant billing, order and kitchen operations.', 'operations', 10),
  ('fine_dine', 'Fine Dine', 'Table service, captain ordering, kitchen tickets and settlement.', 'operations', 20),
  ('table_qr', 'Table QR', 'QR menu, table-side ordering and order status.', 'ordering', 30),
  ('ordering_web', 'Food Ordering Website', 'Branded online menu, checkout, delivery and pickup.', 'ordering', 40),
  ('ordering_app', 'Food Ordering App', 'Customer mobile ordering, payments and order tracking.', 'ordering', 50)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_family = EXCLUDED.product_family,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

CREATE TABLE IF NOT EXISTS product_features (
  product_code text NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  feature_code text NOT NULL,
  enabled_by_default boolean NOT NULL DEFAULT true,
  default_quantity integer CHECK (default_quantity IS NULL OR default_quantity >= 0),
  configuration_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (product_code, feature_code)
);

INSERT INTO product_features(product_code, feature_code) VALUES
  ('tiffin_qsr', 'quick_billing'),
  ('tiffin_qsr', 'order_management'),
  ('tiffin_qsr', 'kitchen_display'),
  ('tiffin_qsr', 'inventory'),
  ('fine_dine', 'table_management'),
  ('fine_dine', 'captain_ordering'),
  ('fine_dine', 'kitchen_tickets'),
  ('fine_dine', 'split_settlement'),
  ('table_qr', 'digital_menu'),
  ('table_qr', 'qr_table_ordering'),
  ('table_qr', 'order_status'),
  ('ordering_web', 'branded_menu_website'),
  ('ordering_web', 'online_checkout'),
  ('ordering_web', 'delivery_pickup'),
  ('ordering_app', 'customer_mobile_app'),
  ('ordering_app', 'push_notifications'),
  ('ordering_app', 'order_tracking')
ON CONFLICT (product_code, feature_code) DO NOTHING;

-- A plan may include one or several products. Pricing remains deliberately unseeded.
CREATE TABLE IF NOT EXISTS plan_products (
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  product_code text NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  PRIMARY KEY (plan_id, product_code)
);

-- Existing registrations are assigned to Fine Dine for backwards compatibility.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS product_code text;
UPDATE subscriptions SET product_code = 'fine_dine' WHERE product_code IS NULL;
ALTER TABLE subscriptions ALTER COLUMN product_code SET DEFAULT 'fine_dine';
ALTER TABLE subscriptions ALTER COLUMN product_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_product_code_fk'
      AND conrelid = 'subscriptions'::regclass
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_product_code_fk
      FOREIGN KEY (product_code) REFERENCES product_catalog(code) ON DELETE RESTRICT;
  END IF;
END $$;

DROP INDEX IF EXISTS subscriptions_one_live_trial_per_org;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_live_trial_per_org_product
  ON subscriptions(organization_id, product_code)
  WHERE status IN ('provisioning', 'trialing');

CREATE INDEX IF NOT EXISTS subscriptions_org_product_status_idx
  ON subscriptions(organization_id, product_code, status);

-- Enables/disables each product at an outlet independently of the business account.
CREATE TABLE IF NOT EXISTS outlet_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  product_code text NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outlet_id, product_code)
);
CREATE INDEX IF NOT EXISTS outlet_products_org_status_idx
  ON outlet_products(organization_id, status, product_code);

-- Explicit feature overrides for a subscription; plan defaults remain in plan_entitlements.
CREATE TABLE IF NOT EXISTS subscription_entitlements (
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  feature_code text NOT NULL,
  enabled boolean NOT NULL,
  quantity integer CHECK (quantity IS NULL OR quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscription_id, feature_code)
);
