// Licence keys against a real PostgreSQL (PGlite, in-process) with the real migrations 0001..0004.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { generateSigningKeyPair, loadSigningKey, publicKeyFromBase64, verifyKey } from "@finedine/licensing";
import { issueLicence, LicenceError, listLicences, revokeLicence, trustedKeyInfo, type Queryable, type Signer } from "./licences.js";

const migrations = new URL("../../../packages/saas-db/migrations/", import.meta.url);
const pair = generateSigningKeyPair();
const signer: Signer = { key: loadSigningKey(pair.privateKeyPem), kid: "cloud", maxDays: 400 };
const trusted = [{ id: "cloud", publicKey: publicKeyFromBase64(pair.publicKeyBase64), maxDays: 400 }];
const HW = "20E5-D193-93D0-381F-44B3";
const HW2 = "61B1-56E8-F279-5FE8-261F";
const DAY = 86_400_000;
const NOW = new Date("2026-11-08T10:00:00Z");

/** A fresh database with every migration applied, used through the same interface as pg. */
async function database(): Promise<Queryable> {
  const db = new PGlite({ extensions: { pgcrypto } });
  for (const file of readdirSync(migrations).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()) {
    await db.exec(readFileSync(new URL(file, migrations), "utf8"));
  }
  return db as unknown as Queryable;
}

async function account(db: Queryable, name = "Spice Route") {
  const user = (await db.query("INSERT INTO users (full_name, email, password_hash, status) VALUES ($1, $2, 'x', 'active') RETURNING id", [name, `${name.replace(/\W/g, "")}@example.com`])).rows[0].id as string;
  const org = (await db.query("INSERT INTO organizations (name, slug, owner_user_id) VALUES ($1, $2, $3) RETURNING id", [name, `${name.replace(/\W/g, "").toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`, user])).rows[0].id as string;
  const outlet = (await db.query("INSERT INTO outlets (organization_id, name, slug, deployment_type, status) VALUES ($1, 'Park Street', $2, 'on_premise', 'active') RETURNING id", [org, `park-${Math.random().toString(36).slice(2, 8)}`])).rows[0].id as string;
  return { user, org, outlet };
}

async function subscription(db: Queryable, org: string, product: string, status: "trialing" | "active", ends: Date, planId: string | null = null) {
  return (await db.query(
    `INSERT INTO subscriptions (organization_id, product_code, plan_id, status, trial_start_at, trial_end_at, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, $5, $7) RETURNING id`,
    [org, product, planId, status, new Date(NOW.getTime() - DAY), status === "trialing" ? ends : null, status === "active" ? ends : null],
  )).rows[0].id as string;
}

const refusal = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { if (e instanceof LicenceError) return e.code; throw e; }
  return "issued";
};

test("a trial key: signed for the PC, labelled Fine Dine, ends with the trial, verifiable offline, recorded and audited", async () => {
  const db = await database();
  const a = await account(db);
  const trialEnd = new Date(NOW.getTime() + 14 * DAY);
  await subscription(db, a.org, "fine_dine", "trialing", trialEnd);
  const { licence, reused } = await issueLicence(db, signer, { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW.toLowerCase(), actorUserId: a.user, now: NOW });
  assert.equal(reused, false);
  assert.equal(licence.type, "trial");
  assert.equal(licence.hardwareId, HW);
  assert.equal(licence.expiresAt, trialEnd.toISOString());
  assert.deepEqual(licence.seats, { terminals: 1, captains: 1, kds: 1 });
  assert.deepEqual(licence.features, ["trial"]);
  assert.equal(licence.licensee, "Spice Route, Park Street");
  const v = verifyKey(licence.key!, trusted, HW, { product: "fine_dine", requireProduct: true });
  assert.equal(v.ok, true);
  assert.equal(v.ok && v.payload.outletId, a.outlet);
  const audit = await db.query("SELECT action FROM audit_logs WHERE entity_id = $1", [licence.id]);
  assert.deepEqual(audit.rows.map((r) => r.action), ["licence.issued"]);
  assert.deepEqual(trustedKeyInfo(signer), [{ kid: "cloud", publicKey: pair.publicKeyBase64, maxDays: 400 }]);
});

test("asking again for the same PC returns the same key; another PC replaces it", async () => {
  const db = await database();
  const a = await account(db);
  await subscription(db, a.org, "fine_dine", "trialing", new Date(NOW.getTime() + 14 * DAY));
  const input = { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW };
  const first = await issueLicence(db, signer, input);
  const again = await issueLicence(db, signer, { ...input, now: new Date(NOW.getTime() + 60_000) });
  assert.equal(again.reused, true);
  assert.equal(again.licence.id, first.licence.id);
  const moved = await issueLicence(db, signer, { ...input, hardwareId: HW2, now: new Date(NOW.getTime() + 120_000) });
  assert.equal(moved.reused, false);
  const all = await listLicences(db, a.org);
  assert.deepEqual(all.map((l) => [l.hardwareId, l.status]), [[HW2, "active"], [HW, "superseded"]]);
  assert.equal(all.find((l) => l.hardwareId === HW)!.statusReason, `replaced by ${moved.licence.id}`);
});

test("a paid plan: seats from the plan and the subscription's overrides; never longer than the signer allows", async () => {
  const db = await database();
  const a = await account(db);
  const plan = (await db.query("INSERT INTO plans (code, name, billing_interval, amount_minor) VALUES ('fd-pro', 'Pro', 'yearly', 0) RETURNING id")).rows[0].id as string;
  await db.query("INSERT INTO plan_entitlements (plan_id, feature_code, quantity) VALUES ($1, 'seats.terminals', 3), ($1, 'seats.captains', 4), ($1, 'online_orders', NULL)", [plan]);
  const sub = await subscription(db, a.org, "fine_dine", "active", new Date(NOW.getTime() + 500 * DAY), plan);
  await db.query("INSERT INTO subscription_entitlements (subscription_id, feature_code, enabled, quantity) VALUES ($1, 'seats.kds', true, 2), ($1, 'seats.captains', false, 9)", [sub]);
  const { licence } = await issueLicence(db, signer, { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW });
  assert.equal(licence.type, "subscription");
  assert.deepEqual(licence.seats, { terminals: 3, captains: 0, kds: 2 });
  assert.deepEqual(licence.features, []);
  assert.equal(licence.expiresAt, new Date(NOW.getTime() + 400 * DAY).toISOString());
  assert.equal(verifyKey(licence.key!, trusted, HW).ok, true);
});

test("refused: no signing key, a bad hardware id, someone else's outlet, no trial or plan, a trial that ended", async () => {
  const db = await database();
  const a = await account(db);
  const b = await account(db, "Other Cafe");
  await subscription(db, a.org, "fine_dine", "trialing", new Date(NOW.getTime() + 14 * DAY));
  await subscription(db, a.org, "tiffin_qsr", "trialing", new Date(NOW.getTime() - 3_600_000));
  const input = { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW };
  assert.equal(await refusal(issueLicence(db, null, input)), "LICENSING_UNAVAILABLE");
  assert.equal(await refusal(issueLicence(db, signer, { ...input, hardwareId: "AB12" })), "VALIDATION_ERROR");
  assert.equal(await refusal(issueLicence(db, signer, { ...input, outletId: b.outlet })), "NOT_FOUND");
  assert.equal(await refusal(issueLicence(db, signer, { ...input, productCode: "table_qr" })), "NO_SUBSCRIPTION");
  assert.equal(await refusal(issueLicence(db, signer, { ...input, productCode: "tiffin_qsr" })), "SUBSCRIPTION_ENDED");
  assert.equal(await refusal(issueLicence(db, signer, { ...input, productCode: "nope" })), "NOT_FOUND");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM licences")).rows[0].n, 0);
});

test("keys are append-only: revoked once, never edited, deleted or re-activated; accounts see only their own", async () => {
  const db = await database();
  const a = await account(db);
  const b = await account(db, "Other Cafe");
  await subscription(db, a.org, "fine_dine", "trialing", new Date(NOW.getTime() + 14 * DAY));
  const { licence } = await issueLicence(db, signer, { organizationId: a.org, outletId: a.outlet, productCode: "fine_dine", hardwareId: HW, actorUserId: a.user, now: NOW });
  await assert.rejects(db.query("UPDATE licences SET licence_key = 'x' WHERE id = $1", [licence.id]), /append-only/);
  await assert.rejects(db.query("UPDATE licences SET expires_at = expires_at + interval '1 year' WHERE id = $1", [licence.id]), /append-only/);
  await assert.rejects(db.query("DELETE FROM licences WHERE id = $1", [licence.id]), /append-only/);
  assert.equal(await refusal(revokeLicence(db, { organizationId: b.org, licenceId: licence.id, reason: "x", actorUserId: b.user })), "NOT_FOUND");
  const revoked = await revokeLicence(db, { organizationId: a.org, licenceId: licence.id, reason: "  PC  stolen ", actorUserId: a.user });
  assert.equal(revoked.status, "revoked");
  assert.equal(revoked.statusReason, "PC stolen");
  const again = await revokeLicence(db, { organizationId: a.org, licenceId: licence.id, reason: "other", actorUserId: a.user });
  assert.equal(again.statusReason, "PC stolen");
  await assert.rejects(db.query("UPDATE licences SET status = 'active' WHERE id = $1", [licence.id]), /already revoked/);
  assert.equal((await listLicences(db, b.org)).length, 0);
  assert.deepEqual((await db.query("SELECT action FROM audit_logs WHERE entity_id = $1 ORDER BY created_at", [licence.id])).rows.map((r) => r.action), ["licence.issued", "licence.revoked"]);
});
