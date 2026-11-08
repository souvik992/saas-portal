// Licence keys against the real schema (in-memory SQLite with every migration applied).
import assert from "node:assert/strict";
import test from "node:test";
import { generateSigningKeyPair, loadSigningKey, publicKeyFromBase64, verifyKey } from "@finedine/licensing";
import { exec, many, newId, one, openDatabase, type Db } from "./db.js";
import { issueLicence, LicenceError, listLicences, revokeLicence, trustedKeyInfo, type Signer } from "./licences.js";

const pair = generateSigningKeyPair();
const signer: Signer = { key: loadSigningKey(pair.privateKeyPem), kid: "cloud", maxDays: 400 };
const trusted = [{ id: "cloud", publicKey: publicKeyFromBase64(pair.publicKeyBase64), maxDays: 400 }];
const HW = "20E5-D193-93D0-381F-44B3";
const HW2 = "61B1-56E8-F279-5FE8-261F";
const DAY = 86_400_000;
const NOW = new Date("2026-11-08T10:00:00Z");
const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();

function account(db: Db, name = "Spice Route") {
  const user = newId(), org = newId(), outlet = newId();
  const tag = name.replace(/\W/g, "").toLowerCase();
  exec(db, "INSERT INTO users (id, full_name, email, password_hash, status) VALUES (?, ?, ?, 'x', 'active')", user, name, `${tag}@example.com`);
  exec(db, "INSERT INTO organizations (id, name, slug, owner_user_id) VALUES (?, ?, ?, ?)", org, name, `${tag}-${org.slice(0, 6)}`, user);
  exec(db, "INSERT INTO outlets (id, organization_id, name, slug, deployment_type, status) VALUES (?, ?, 'Park Street', ?, 'on_premise', 'active')", outlet, org, `park-${outlet.slice(0, 6)}`);
  return { user, org, outlet };
}

function subscription(db: Db, org: string, product: string, status: "trialing" | "active", ends: string, planId: string | null = null): string {
  const id = newId();
  exec(db,
    `INSERT INTO subscriptions (id, organization_id, product_code, plan_id, status, trial_start_at, trial_end_at, current_period_start, current_period_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, org, product, planId, status, at(-DAY), status === "trialing" ? ends : null, at(-DAY), status === "active" ? ends : null);
  return id;
}

const refusal = (work: () => unknown) => {
  try { work(); } catch (e) { if (e instanceof LicenceError) return e.code; throw e; }
  return "issued";
};

test("a trial key: signed for the PC, labelled Fine Dine, ends with the trial, verifiable offline, recorded and audited", () => {
  const db = openDatabase(":memory:");
  const a = account(db);
  subscription(db, a.org, "fine_dine", "trialing", at(14 * DAY));
  const { licence, reused } = issueLicence(db, signer, { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW.toLowerCase(), actorUserId: a.user, now: NOW });
  assert.equal(reused, false);
  assert.equal(licence.type, "trial");
  assert.equal(licence.hardwareId, HW);
  assert.equal(licence.expiresAt, at(14 * DAY));
  assert.deepEqual(licence.seats, { terminals: 1, captains: 1, kds: 1 });
  assert.deepEqual(licence.features, ["trial"]);
  assert.equal(licence.licensee, "Spice Route, Park Street");
  const v = verifyKey(licence.key, trusted, HW, { product: "fine_dine", requireProduct: true });
  assert.equal(v.ok, true);
  assert.equal(v.ok && v.payload.outletId, a.outlet);
  assert.deepEqual(many(db, "SELECT action FROM audit_logs WHERE entity_id = ?", licence.id).map((r) => r.action), ["licence.issued"]);
  assert.deepEqual(trustedKeyInfo(signer), [{ kid: "cloud", publicKey: pair.publicKeyBase64, maxDays: 400 }]);
});

test("asking again for the same PC returns the same key; another PC replaces it", () => {
  const db = openDatabase(":memory:");
  const a = account(db);
  subscription(db, a.org, "fine_dine", "trialing", at(14 * DAY));
  const input = { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW };
  const first = issueLicence(db, signer, input);
  const again = issueLicence(db, signer, { ...input, now: new Date(NOW.getTime() + 60_000) });
  assert.equal(again.reused, true);
  assert.equal(again.licence.id, first.licence.id);
  const moved = issueLicence(db, signer, { ...input, hardwareId: HW2, now: new Date(NOW.getTime() + 120_000) });
  assert.equal(moved.reused, false);
  const all = listLicences(db, a.org);
  assert.deepEqual(all.map((l) => [l.hardwareId, l.status]), [[HW2, "active"], [HW, "superseded"]]);
  assert.equal(all[1]!.statusReason, `replaced by ${moved.licence.id}`);
});

test("a paid plan: seats from the plan and the subscription's overrides; never longer than the signer allows", () => {
  const db = openDatabase(":memory:");
  const a = account(db);
  const plan = newId();
  exec(db, "INSERT INTO plans (id, code, name, billing_interval, amount_minor) VALUES (?, 'fd-pro', 'Pro', 'yearly', 0)", plan);
  for (const [feature, qty] of [["seats.terminals", 3], ["seats.captains", 4], ["online_orders", null]] as const) {
    exec(db, "INSERT INTO plan_entitlements (id, plan_id, feature_code, quantity) VALUES (?, ?, ?, ?)", newId(), plan, feature, qty);
  }
  const sub = subscription(db, a.org, "fine_dine", "active", at(500 * DAY), plan);
  exec(db, "INSERT INTO subscription_entitlements (subscription_id, feature_code, enabled, quantity) VALUES (?, 'seats.kds', 1, 2), (?, 'seats.captains', 0, 9)", sub, sub);
  const { licence } = issueLicence(db, signer, { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW });
  assert.equal(licence.type, "subscription");
  assert.deepEqual(licence.seats, { terminals: 3, captains: 0, kds: 2 });
  assert.deepEqual(licence.features, []);
  assert.equal(licence.expiresAt, at(400 * DAY));
  assert.equal(verifyKey(licence.key, trusted, HW).ok, true);
});

test("refused: no signing key, a bad hardware id, someone else's outlet, no trial or plan, a trial that ended, no such product", () => {
  const db = openDatabase(":memory:");
  const a = account(db);
  const b = account(db, "Other Cafe");
  subscription(db, a.org, "fine_dine", "trialing", at(14 * DAY));
  subscription(db, a.org, "tiffin_qsr", "trialing", at(-3_600_000));
  const input = { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW };
  assert.equal(refusal(() => issueLicence(db, null, input)), "LICENSING_UNAVAILABLE");
  assert.equal(refusal(() => issueLicence(db, signer, { ...input, hardwareId: "AB12" })), "VALIDATION_ERROR");
  assert.equal(refusal(() => issueLicence(db, signer, { ...input, outletId: b.outlet })), "NOT_FOUND");
  assert.equal(refusal(() => issueLicence(db, signer, { ...input, productCode: "table_qr" })), "NO_SUBSCRIPTION");
  assert.equal(refusal(() => issueLicence(db, signer, { ...input, productCode: "tiffin_qsr" })), "SUBSCRIPTION_ENDED");
  assert.equal(refusal(() => issueLicence(db, signer, { ...input, productCode: "nope" })), "NOT_FOUND");
  assert.equal(one(db, "SELECT count(*) AS n FROM licences")!.n, 0);
});

test("keys are append-only: revoked once, never edited, deleted or re-activated; accounts see only their own", () => {
  const db = openDatabase(":memory:");
  const a = account(db);
  const b = account(db, "Other Cafe");
  subscription(db, a.org, "fine_dine", "trialing", at(14 * DAY));
  const { licence } = issueLicence(db, signer, { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW });
  assert.throws(() => exec(db, "UPDATE licences SET licence_key = 'x' WHERE id = ?", licence.id), /append-only/);
  assert.throws(() => exec(db, "UPDATE licences SET expires_at = '2099-01-01T00:00:00.000Z' WHERE id = ?", licence.id), /append-only/);
  assert.throws(() => exec(db, "DELETE FROM licences WHERE id = ?", licence.id), /append-only/);
  assert.equal(refusal(() => revokeLicence(db, { organizationId: b.org, licenceId: licence.id, reason: "x", actorUserId: b.user })), "NOT_FOUND");
  const revoked = revokeLicence(db, { organizationId: a.org, licenceId: licence.id, reason: "  PC  stolen ", actorUserId: a.user });
  assert.equal(revoked.status, "revoked");
  assert.equal(revoked.statusReason, "PC stolen");
  assert.equal(revokeLicence(db, { organizationId: a.org, licenceId: licence.id, reason: "other", actorUserId: a.user }).statusReason, "PC stolen");
  assert.throws(() => exec(db, "UPDATE licences SET status = 'active' WHERE id = ?", licence.id), /already revoked/);
  assert.equal(listLicences(db, b.org).length, 0);
  assert.deepEqual(many(db, "SELECT action FROM audit_logs WHERE entity_id = ? ORDER BY created_at", licence.id).map((r) => r.action), ["licence.issued", "licence.revoked"]);
});

test("migrations: both applied on a new database, with the product catalogue", () => {
  const db = openDatabase(":memory:");
  assert.deepEqual(many(db, "SELECT filename FROM saas_schema_migrations ORDER BY filename").map((r) => r.filename), ["0001_saas_core.sql", "0002_licence_keys.sql"]);
  assert.equal(one(db, "SELECT count(*) AS n FROM product_catalog")!.n, 5);
});
