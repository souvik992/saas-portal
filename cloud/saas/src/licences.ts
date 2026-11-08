// Licence keys for outlets (packages/licensing): a key is signed for one PC from the outlet's subscription to a product
// (trial: until the trial ends; paid: until the current period ends; never longer than the signer allows). Every key is
// a row in `licences` (append-only, migration 0002). The product checks the key offline, so revoking here stops it being
// shown and renewed, not a copy already installed: that copy works until it ends.
import type { KeyObject } from "node:crypto";
import { keyHash, normaliseHardwareId, publicKeyBase64, signKey, type Seats } from "@finedine/licensing";
import { exec, many, newId, nowIso, one, tx, type Db, type Row } from "./db.js";

export interface Signer {
  key: KeyObject;
  /** Written into each key (`kid`); the products trust this id with `maxDays`. */
  kid: string;
  maxDays: number;
}

export class LicenceError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
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
  licensee: string;
  seats: Seats;
  features: string[];
  status: string;
  statusReason: string | null;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  key: string;
}

const toView = (r: Row): LicenceView => ({
  id: r.id, outletId: r.outlet_id, outletName: r.outlet_name, productCode: r.product_code, type: r.licence_type, hardwareId: r.hardware_id,
  licensee: r.licensee, seats: JSON.parse(r.seats) as Seats, features: JSON.parse(r.features) as string[], status: r.status,
  statusReason: r.status_reason ?? null, issuedAt: r.issued_at, expiresAt: r.expires_at, revokedAt: r.revoked_at ?? null, key: r.licence_key,
});
const SELECT_VIEW = "SELECT l.*, o.name AS outlet_name FROM licences l JOIN outlets o ON o.id = l.outlet_id";
const sameSeats = (a: Seats, b: Seats) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => a[k] === b[k]);

/** The public keys products should trust for keys from this server. */
export function trustedKeyInfo(signer: Signer | null): { kid: string; publicKey: string; maxDays: number }[] {
  return signer ? [{ kid: signer.kid, publicKey: publicKeyBase64(signer.key), maxDays: signer.maxDays }] : [];
}

/** Seats for a subscription: the product's defaults, then plan entitlements, then the subscription's own overrides. */
function seatsFor(db: Db, productCode: string, subscription: { id: string; plan_id: string | null }): Seats {
  const seats: Seats = { ...(DEFAULT_SEATS[productCode] ?? FALLBACK_SEATS) };
  const rows = many<{ feature_code: string; quantity: number | null; enabled: number }>(db,
    `SELECT feature_code, quantity, enabled, 1 AS rank FROM plan_entitlements WHERE plan_id = ? AND feature_code LIKE 'seats.%'
     UNION ALL
     SELECT feature_code, quantity, enabled, 2 AS rank FROM subscription_entitlements WHERE subscription_id = ? AND feature_code LIKE 'seats.%'
     ORDER BY rank`,
    subscription.plan_id, subscription.id);
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
export function issueLicence(db: Db, signer: Signer | null, input: IssueInput): { licence: LicenceView; reused: boolean } {
  if (!signer) throw new LicenceError("LICENSING_UNAVAILABLE", 503, "Licence keys cannot be issued right now (no signing key is set up).");
  const hardwareId = normaliseHardwareId(input.hardwareId);
  if (!hardwareId) throw new LicenceError("VALIDATION_ERROR", 400, "The hardware id looks like AB12-CD34-EF56-7890-1A2B (shown in the product's licence settings).");
  const now = input.now ?? new Date();
  const nowText = nowIso(now);
  return tx(db, () => {
    const outlet = one<{ id: string; name: string; organization_name: string }>(db,
      `SELECT o.id, o.name, org.name AS organization_name FROM outlets o JOIN organizations org ON org.id = o.organization_id
       WHERE o.id = ? AND o.organization_id = ? AND o.status IN ('provisioning','active') AND org.status = 'active'`,
      input.outletId, input.organizationId);
    if (!outlet) throw new LicenceError("NOT_FOUND", 404, "No such outlet in your account.");
    if (!one(db, "SELECT code FROM product_catalog WHERE code = ? AND active = 1", input.productCode)) throw new LicenceError("NOT_FOUND", 404, "No such product.");
    const sub = one<{ id: string; plan_id: string | null; status: string; trial_end_at: string | null; current_period_end: string | null }>(db,
      `SELECT id, plan_id, status, trial_end_at, current_period_end FROM subscriptions
       WHERE organization_id = ? AND product_code = ? AND status IN ('trialing','active')
       ORDER BY (status = 'active') DESC, COALESCE(current_period_end, trial_end_at) DESC LIMIT 1`,
      input.organizationId, input.productCode);
    if (!sub) throw new LicenceError("NO_SUBSCRIPTION", 402, "There is no active trial or plan for this product. Start a trial or choose a plan first.");
    const trial = sub.status === "trialing";
    const ends = trial ? sub.trial_end_at : sub.current_period_end;
    if (!ends || Date.parse(ends) <= now.getTime()) {
      throw new LicenceError("SUBSCRIPTION_ENDED", 402, trial ? "The free trial has ended. Choose a plan to keep using the product." : "The current plan period has ended. Renew to get a new key.");
    }
    const expiresAt = new Date(Math.min(Date.parse(ends), now.getTime() + signer.maxDays * DAY_MS));
    const seats = seatsFor(db, input.productCode, sub);
    const features = trial ? ["trial"] : [];
    const type = trial ? "trial" : "subscription";

    const same = one(db,
      `${SELECT_VIEW} WHERE l.outlet_id = ? AND l.product_code = ? AND l.hardware_id = ? AND l.status = 'active' AND l.subscription_id = ? AND l.expires_at = ?`,
      outlet.id, input.productCode, hardwareId, sub.id, nowIso(expiresAt));
    if (same && sameSeats(JSON.parse(same.seats) as Seats, seats)) return { licence: toView(same), reused: true };

    const licensee = (outlet.organization_name === outlet.name ? outlet.name : `${outlet.organization_name}, ${outlet.name}`).replace(/\s+/g, " ").trim().slice(0, 120);
    const key = signKey({ kid: signer.kid, licensee, hardwareId, issuedAt: now, expiresAt, seats, features, outletId: outlet.id, product: input.productCode }, signer.key);
    const id = newId();
    exec(db, `UPDATE licences SET status = 'superseded', status_reason = ? WHERE outlet_id = ? AND product_code = ? AND status = 'active'`,
      `replaced by ${id}`, outlet.id, input.productCode);
    exec(db,
      `INSERT INTO licences (id, organization_id, outlet_id, subscription_id, product_code, licence_type, payload_version, hardware_id, licensee,
         seats, features, key_id, licence_key, signed_key_hash, status, issued_at, expires_at, created_by, created_by_type)
       VALUES (?,?,?,?,?,?,1,?,?,?,?,?,?,?,'active',?,?,?,?)`,
      id, input.organizationId, outlet.id, sub.id, input.productCode, type, hardwareId, licensee, JSON.stringify(seats), JSON.stringify(features),
      signer.kid, key, keyHash(key), nowText, nowIso(expiresAt), input.actorUserId, input.actorType ?? "user");
    exec(db,
      "INSERT INTO audit_logs (id, organization_id, actor_user_id, actor_type, action, entity_type, entity_id, metadata) VALUES (?,?,?,?,'licence.issued','licence',?,?)",
      newId(), input.organizationId, input.actorUserId, input.actorType ?? "user", id,
      JSON.stringify({ outletId: outlet.id, productCode: input.productCode, hardwareId, type, expiresAt: nowIso(expiresAt), kid: signer.kid }));
    return { licence: toView(one(db, `${SELECT_VIEW} WHERE l.id = ?`, id)!), reused: false };
  });
}

/** The account's keys, newest first. */
export function listLicences(db: Db, organizationId: string): LicenceView[] {
  return many(db, `${SELECT_VIEW} WHERE l.organization_id = ? ORDER BY l.issued_at DESC LIMIT 200`, organizationId).map(toView);
}

/** Marks a key revoked (once; asking again returns it unchanged). */
export function revokeLicence(db: Db, input: { organizationId: string; licenceId: string; reason: unknown; actorUserId: string | null }): LicenceView {
  const reason = String(input.reason ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || "revoked";
  return tx(db, () => {
    const row = one(db, `${SELECT_VIEW} WHERE l.id = ? AND l.organization_id = ?`, input.licenceId, input.organizationId);
    if (!row) throw new LicenceError("NOT_FOUND", 404, "No such licence in your account.");
    if (row.status !== "active") return toView(row);
    exec(db, "UPDATE licences SET status = 'revoked', status_reason = ?, revoked_at = ? WHERE id = ?", reason, nowIso(), row.id);
    exec(db, "INSERT INTO audit_logs (id, organization_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES (?,?,?,'licence.revoked','licence',?,?)",
      newId(), input.organizationId, input.actorUserId, row.id, JSON.stringify({ reason }));
    return toView(one(db, `${SELECT_VIEW} WHERE l.id = ?`, row.id)!);
  });
}
