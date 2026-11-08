-- Licence keys issued by the platform (packages/licensing). PostgreSQL SaaS database only.
-- Extends `licences` (0001) so each row is one signed key: what it says, its full text (customers copy it again from
-- the portal; a key only works on the PC it names), who issued it, and its product. Rows are append-only: a key is
-- never edited or deleted; only its status moves on (revoked, superseded, expired), once.

ALTER TABLE licences
  ADD COLUMN IF NOT EXISTS product_code text NOT NULL DEFAULT 'fine_dine' REFERENCES product_catalog(code) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS licensee text,
  ADD COLUMN IF NOT EXISTS seats jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS licence_key text,
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_type text NOT NULL DEFAULT 'user'
    CHECK (created_by_type IN ('user', 'admin', 'system', 'worker'));

-- `demo`: a short key for a browser demo outlet.
ALTER TABLE licences DROP CONSTRAINT IF EXISTS licences_licence_type_check;
ALTER TABLE licences ADD CONSTRAINT licences_licence_type_check
  CHECK (licence_type IN ('trial', 'subscription', 'enterprise', 'demo'));

ALTER TABLE licences DROP CONSTRAINT IF EXISTS licences_hardware_id_format;
ALTER TABLE licences ADD CONSTRAINT licences_hardware_id_format
  CHECK (hardware_id ~ '^[0-9A-F]{4}(-[0-9A-F]{4}){4}$');

CREATE UNIQUE INDEX IF NOT EXISTS licences_signed_key_hash_uq ON licences(signed_key_hash);
CREATE INDEX IF NOT EXISTS licences_outlet_product_idx ON licences(outlet_id, product_code, issued_at DESC);

-- Append-only: no DELETE; an UPDATE may only move an active key to revoked / superseded / expired (with its reason and
-- time), once. Everything a key says, and its text, stays as issued.
CREATE OR REPLACE FUNCTION licences_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'licences are append-only: a key is revoked, never deleted' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.status <> 'active' THEN
    RAISE EXCEPTION 'licence % is already %', OLD.id, OLD.status USING ERRCODE = 'restrict_violation';
  END IF;
  IF (to_jsonb(NEW) - ARRAY['status', 'status_reason', 'revoked_at']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status', 'status_reason', 'revoked_at']) THEN
    RAISE EXCEPTION 'licences are append-only: only the status of a key may change' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS licences_append_only ON licences;
CREATE TRIGGER licences_append_only BEFORE UPDATE OR DELETE ON licences
  FOR EACH ROW EXECUTE FUNCTION licences_append_only();
