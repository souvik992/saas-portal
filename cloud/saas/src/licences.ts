// Licence keys for outlets (packages/licensing): a key is signed for one PC from the outlet's subscription to a product
// (trial: until the trial ends; paid: until the current period ends; never longer than the signer allows). Every key is
// a row in `licences` (append-only, migration 0004). The product checks the key offline, so revoking here stops it being
// shown and renewed, not a copy already installed: that copy works until it ends.
import type { KeyObject } from "node:crypto";
import { keyHash, normaliseHardwareId, publicKeyBase64, signKey, type Seats } from "@finedine/licensing";

/** A database connection: pg's PoolClient or, in tests, PGlite. Each call below runs its own transaction on it. */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

export interface Signer {
  key: KeyObject;
  /** Written into each key (`kid`); the products trust this id with `maxDays`. */
  kid: string;
  maxDays: number;
}

export class LicenceError extends Error {
  constructor(readonly code: string, readonly status: number, message: string) {
    super(message);
  }
}

/**
 * Seats when the plan names none (feature codes `seats.<kind>` in plan or subscription entitlements override them).
 * Fine Dine's app needs all three kinds in every key.
 */
export const DEFAULT_SEATS: Record<string, Seats> = {
  fine_dine: { terminals: 1, captains: 1, kds: 1 },
  tiffin_qsr: { terminals: 1, kds: 1 },
};
const FALLBACK_SEATS: Seats = { terminals: 1 };
const DAY_MS = 86_400_000;

export interface LicenceView {
  id: string;
  outletId: string;
  outletName: string;
  productCode: string;
  type: string;
  hardwareId: string;
  licensee: string | null;
  seats: Seats;
  features: string[];
  status: string;
  statusReason: string | null;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  key: string | null;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString());
const toView = (r: any): LicenceView => ({
  id: r.id, outletId: r.outlet_id, outletName: r.outlet_name, productCode: r.product_code, type: r.licence_type, hardwareId: r.hardware_id,
  licensee: r.licensee, seats: r.seats, features: r.features, status: r.status, statusReason: r.status_reason,
  issuedAt: iso(r.issued_at), expiresAt: iso(r.expires_at), revokedAt: r.revoked_at ? iso(r.revoked_at) : null, key: r.licence_key,
});
/** jsonb keeps its own key order, so seats are compared kind by kind. */
const sameSeats = (a: Seats, b: Seats) => {
  const kinds = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...kinds].every((k) => a[k] === b[k]);
};
const SELECT_VIEW =`SELECT l.*, o.name AS outlet_name FROM licences l JOIN outlets o ON o.id = l.outlet_id`;

async function inTransaction<T>(db: Queryable, work: () => Promise<T>): Promise<T> {
  await db.query("BEGIN");
  try {
    const result = await work();
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

/** The public keys products should trust for keys from this server. */
export function trustedKeyInfo(signer: Signer | null): { kid: string; publicKey: string; maxDays: number }[] {
  return signer ? [{ kid: signer.kid, publicKey: publicKeyBase64(signer.key), maxDays: signer.maxDays }] : [];
}

/** Seats for a subscription: the product's defaults, then plan entitlements, then the subscription's own overrides. */
async function seatsFor(db: Queryable, productCode: string, subscription: { id: string; plan_id: string | null }): Promise<Seats> {
  const seats: Seats = { ...(DEFAULT_SEATS[productCode] ?? FALLBACK_SEATS) };
  const rows = (await db.query(
    `SELECT feature_code, quantity, enabled, 1 AS rank FROM plan_entitlements WHERE plan_id = $1 AND feature_code LIKE 'seats.%'
     UNION ALL
     SELECT feature_code, quantity, enabled, 2 AS rank FROM subscription_entitlements WHERE subscription_id = $2 AND feature_code LIKE 'seats.%'
     ORDER BY rank`,
    [subscription.plan_id, subscription.id],
  )).rows as { feature_code: string; quantity: number | null; enabled: boolean }[];
  for (const r of rows) {
    const kind = r.feature_code.slice("seats.".length);
    if (!/^[a-z][a-z0-9_]{0,30}$/.test(kind)) continue;
    seats[kind] = r.enabled ? Math.max(0, r.quantity ?? 0) : 0;
  }
  return seats;
}

export interface IssueInput {
  organizationId: string;
  outletId: string;
  productCode: string;
  hardwareId: unknown;
  actorUserId: string | null;
  actorType?: "user" | "admin" | "system" | "worker";
  now?: Date;
}

/**
 * Signs a key for the outlet's PC from its live subscription to the product. Asking again for the same PC and period
 * returns the same key; a key for another PC replaces (supersedes) the outlet's earlier key for that product.
 */
export async function issueLicence(db: Queryable, signer: Signer | null, input: IssueInput): Promise<{ licence: LicenceView; reused: boolean }> {
  if (!signer) throw new LicenceError("LICENSING_UNAVAILABLE", 503, "Licence keys cannot be issued right now (no signing key is set up).");
  const hardwareId = normaliseHardwareId(input.hardwareId);
  if (!hardwareId) throw new LicenceError("VALIDATION_ERROR", 400, "The hardware id looks like AB12-CD34-EF56-7890-1A2B (shown in the product's licence settings).");
  const now = input.now ?? new Date();
  return inTransaction(db, async () => {
    const outlet = (await db.query(
      `SELECT o.id, o.name, org.name AS organization_name FROM outlets o JOIN organizations org ON org.id = o.organization_id
       WHERE o.id = $1 AND o.organization_id = $2 AND o.status IN ('provisioning','active') AND org.status = 'active' FOR UPDATE OF o`,
      [input.outletId, input.organizationId],
    )).rows[0] as { id: string; name: string; organization_name: string } | undefined;
    if (!outlet) throw new LicenceError("NOT_FOUND", 404, "No such outlet in your account.");
    const product = (await db.query("SELECT code FROM product_catalog WHERE code = $1 AND active", [input.productCode])).rows[0];
    if (!product) throw new LicenceError("NOT_FOUND", 404, "No such product.");
    const sub = (await db.query(
      `SELECT id, plan_id, status, trial_end_at, current_period_end FROM subscriptions
       WHERE organization_id = $1 AND product_code = $2 AND status IN ('trialing','active')
       ORDER BY (status = 'active') DESC, COALESCE(current_period_end, trial_end_at) DESC NULLS LAST LIMIT 1`,
      [input.organizationId, input.productCode],
    )).rows[0] as { id: string; plan_id: string | null; status: string; trial_end_at: Date | null; current_period_end: Date | null } | undefined;
    if (!sub) throw new LicenceError("NO_SUBSCRIPTION", 402, "There is no active trial or plan for this product. Start a trial or choose a plan first.");
    const trial = sub.status === "trialing";
    const ends = trial ? sub.trial_end_at : sub.current_period_end;
    if (!ends || new Date(ends).getTime() <= now.getTime()) throw new LicenceError("SUBSCRIPTION_ENDED", 402, trial ? "The free trial has ended. Choose a plan to keep using the product." : "The current plan period has ended. Renew to get a new key.");
    const expiresAt = new Date(Math.min(new Date(ends).getTime(), now.getTime() + signer.maxDays * DAY_MS));
    const seats = await seatsFor(db, input.productCode, sub);
    const features = trial ? ["trial"] : [];
    const type = trial ? "trial" : "subscription";

    const same = (await db.query(
      `${SELECT_VIEW} WHERE l.outlet_id = $1 AND l.product_code = $2 AND l.hardware_id = $3 AND l.status = 'active' AND l.subscription_id = $4 AND l.expires_at = $5 AND l.licence_key IS NOT NULL`,
      [outlet.id, input.productCode, hardwareId, sub.id, expiresAt],
    )).rows[0];
    if (same && sameSeats(same.seats as Seats, seats)) return { licence: toView(same), reused: true };

    const licensee = (outlet.organization_name === outlet.name ? outlet.name : `${outlet.organization_name}, ${outlet.name}`).replace(/\s+/g, " ").trim().slice(0, 120);
    const key = signKey({ kid: signer.kid, licensee, hardwareId, issuedAt: now, expiresAt, seats, features, outletId: outlet.id, product: input.productCode }, signer.key);
    const inserted = (await db.query(
      `INSERT INTO licences (organization_id, outlet_id, subscription_id, licence_type, payload_version, hardware_id, signed_key_hash, key_id, status,
         issued_at, expires_at, product_code, licensee, seats, features, licence_key, created_by, created_by_type)
       VALUES ($1,$2,$3,$4,1,$5,$6,$7,'active',$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [input.organizationId, outlet.id, sub.id, type, hardwareId, keyHash(key), signer.kid, now, expiresAt, input.productCode, licensee,
        JSON.stringify(seats), JSON.stringify(features), key, input.actorUserId, input.actorType ?? "user"],
    )).rows[0] as { id: string };
    await db.query(
      `UPDATE licences SET status = 'superseded', status_reason = $3
       WHERE outlet_id = $1 AND product_code = $2 AND status = 'active' AND id <> $4`,
      [outlet.id, input.productCode, `replaced by ${inserted.id}`, inserted.id],
    );
    await db.query(
      "INSERT INTO audit_logs (organization_id, actor_user_id, actor_type, action, entity_type, entity_id, metadata) VALUES ($1,$2,$3,'licence.issued','licence',$4,$5)",
      [input.organizationId, input.actorUserId, input.actorType ?? "user", inserted.id, JSON.stringify({ outletId: outlet.id, productCode: input.productCode, hardwareId, type, expiresAt: expiresAt.toISOString(), kid: signer.kid })],
    );
    const row = (await db.query(`${SELECT_VIEW} WHERE l.id = $1`, [inserted.id])).rows[0];
    return { licence: toView(row), reused: false };
  });
}

/** The account's keys, newest first. */
export async function listLicences(db: Queryable, organizationId: string): Promise<LicenceView[]> {
  return (await db.query(`${SELECT_VIEW} WHERE l.organization_id = $1 ORDER BY l.issued_at DESC LIMIT 200`, [organizationId])).rows.map(toView);
}

/** Marks a key revoked (once; asking again returns it unchanged). */
export async function revokeLicence(db: Queryable, input: { organizationId: string; licenceId: string; reason: unknown; actorUserId: string | null }): Promise<LicenceView> {
  const reason = String(input.reason ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || "revoked";
  return inTransaction(db, async () => {
    const row = (await db.query(`${SELECT_VIEW} WHERE l.id = $1 AND l.organization_id = $2 FOR UPDATE OF l`, [input.licenceId, input.organizationId])).rows[0];
    if (!row) throw new LicenceError("NOT_FOUND", 404, "No such licence in your account.");
    if (row.status !== "active") return toView(row);
    await db.query("UPDATE licences SET status = 'revoked', status_reason = $2, revoked_at = now() WHERE id = $1", [row.id, reason]);
    await db.query(
      "INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,'licence.revoked','licence',$3,$4)",
      [input.organizationId, input.actorUserId, row.id, JSON.stringify({ reason })],
    );
    return toView((await db.query(`${SELECT_VIEW} WHERE l.id = $1`, [row.id])).rows[0]);
  });
}
