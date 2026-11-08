-- Licence keys issued by the platform (packages/licensing), migration 0002 (SQLite).
-- One row per signed key: what it says, its full text (customers copy it again from the portal; a key works only on
-- the PC it names), who issued it, and its product. Append-only: a key is never edited or deleted; only an active key's
-- status moves on (revoked, superseded, expired), once.

CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE RESTRICT,
  product_code TEXT NOT NULL REFERENCES product_catalog(code) ON DELETE RESTRICT,
  licence_type TEXT NOT NULL CHECK (licence_type IN ('trial', 'subscription', 'enterprise', 'demo')),
  payload_version INTEGER NOT NULL DEFAULT 1 CHECK (payload_version > 0),
  hardware_id TEXT NOT NULL CHECK (hardware_id GLOB '[0-9A-F][0-9A-F][0-9A-F][0-9A-F]-[0-9A-F][0-9A-F][0-9A-F][0-9A-F]-[0-9A-F][0-9A-F][0-9A-F][0-9A-F]-[0-9A-F][0-9A-F][0-9A-F][0-9A-F]-[0-9A-F][0-9A-F][0-9A-F][0-9A-F]'),
  licensee TEXT NOT NULL,
  seats TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(seats)),
  features TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(features)),
  key_id TEXT NOT NULL,
  licence_key TEXT NOT NULL,
  signed_key_hash TEXT NOT NULL UNIQUE CHECK (length(signed_key_hash) = 64),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'superseded')),
  status_reason TEXT,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_type TEXT NOT NULL DEFAULT 'user' CHECK (created_by_type IN ('user', 'admin', 'system', 'worker')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (expires_at > issued_at)
);
CREATE INDEX licences_outlet_product_idx ON licences(outlet_id, product_code, status, issued_at DESC);
CREATE INDEX licences_org_idx ON licences(organization_id, issued_at DESC);

CREATE TRIGGER licences_no_delete BEFORE DELETE ON licences
BEGIN
  SELECT RAISE(ABORT, 'licences are append-only: a key is revoked, never deleted');
END;

CREATE TRIGGER licences_settled BEFORE UPDATE ON licences WHEN OLD.status <> 'active'
BEGIN
  SELECT RAISE(ABORT, 'this licence is already revoked, superseded or expired');
END;

CREATE TRIGGER licences_status_only BEFORE UPDATE ON licences
WHEN NEW.id IS NOT OLD.id OR NEW.organization_id IS NOT OLD.organization_id OR NEW.outlet_id IS NOT OLD.outlet_id
  OR NEW.subscription_id IS NOT OLD.subscription_id OR NEW.product_code IS NOT OLD.product_code
  OR NEW.licence_type IS NOT OLD.licence_type OR NEW.payload_version IS NOT OLD.payload_version
  OR NEW.hardware_id IS NOT OLD.hardware_id OR NEW.licensee IS NOT OLD.licensee OR NEW.seats IS NOT OLD.seats
  OR NEW.features IS NOT OLD.features OR NEW.key_id IS NOT OLD.key_id OR NEW.licence_key IS NOT OLD.licence_key
  OR NEW.signed_key_hash IS NOT OLD.signed_key_hash OR NEW.issued_at IS NOT OLD.issued_at OR NEW.expires_at IS NOT OLD.expires_at
  OR NEW.created_by IS NOT OLD.created_by OR NEW.created_by_type IS NOT OLD.created_by_type OR NEW.created_at IS NOT OLD.created_at
BEGIN
  SELECT RAISE(ABORT, 'licences are append-only: only the status of a key may change');
END;

-- Devices activated under a licence (seat counting; not used by the API yet).
CREATE TABLE device_activations (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  licence_id TEXT REFERENCES licences(id) ON DELETE RESTRICT,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('master', 'terminal', 'captain', 'kds')),
  device_name TEXT,
  activated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at TEXT,
  deactivated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (outlet_id, device_id)
);
CREATE INDEX device_activations_active_idx ON device_activations(outlet_id, device_type) WHERE deactivated_at IS NULL;
