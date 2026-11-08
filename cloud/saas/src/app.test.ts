// The API end to end over HTTP (Fastify inject) on an in-memory SQLite database: register, verify, sign in, then
// licence keys. Email links are read from the development email adapter's log.
import assert from "node:assert/strict";
import test from "node:test";
import { generateSigningKeyPair, loadSigningKey, publicKeyFromBase64, verifyKey } from "@finedine/licensing";

process.env.NODE_ENV = "test";
const { buildSaasApp } = await import("./app.js");
const { exec, isoIn, newId, one, openDatabase } = await import("./db.js");

const pair = generateSigningKeyPair();
const signer = { key: loadSigningKey(pair.privateKeyPem), kid: "cloud", maxDays: 400 };
const HW = "20E5-D193-93D0-381F-44B3";
const address = { addressLine1: "12 Park Street", city: "Kolkata", state: "West Bengal", stateCode: "19", postalCode: "700016" };
const registration = (email: string) => ({
  fullName: "Asha Sen", email, password: "a-long-and-unique-password",
  business: { tradeName: "Spice Route", businessType: "restaurant", address },
  outlet: { name: "Park Street", address },
  acceptedTerms: true, termsVersion: "2026-11",
});

/** Runs `work` and returns the token from the last email link it logged. */
async function emailedToken(work: () => Promise<unknown>): Promise<string> {
  const original = console.info;
  const lines: string[] = [];
  console.info = (...args: unknown[]) => { lines.push(JSON.stringify(args)); };
  try { await work(); } finally { console.info = original; }
  const match = /token=([A-Za-z0-9_-]+)/.exec(lines.join("\n"));
  assert.ok(match, "an email link was logged");
  return match[1]!;
}

async function signedUp(app: ReturnType<typeof buildSaasApp>, email: string): Promise<string> {
  const token = await emailedToken(() => app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { "idempotency-key": `reg-${email.replace(/[^A-Za-z0-9]/g, "-")}` }, payload: registration(email) }));
  const verified = await app.inject({ method: "POST", url: "/api/v1/auth/verify-email", payload: { token } });
  assert.equal(verified.statusCode, 200);
  const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email, password: "a-long-and-unique-password" } });
  assert.equal(login.statusCode, 200);
  return String(login.headers["set-cookie"]).split(";")[0]!;
}

test("register (idempotent), verify, sign in, see the account", async () => {
  const db = openDatabase(":memory:");
  const app = buildSaasApp({ db, signer });
  const body = registration("asha@example.com");
  const token = await emailedToken(() => app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { "idempotency-key": "reg-0001" }, payload: body }));
  const replay = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { "idempotency-key": "reg-0001" }, payload: body });
  assert.equal(replay.statusCode, 202);
  assert.equal(one(db, "SELECT count(*) AS n FROM users")!.n, 1);
  const conflict = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { "idempotency-key": "reg-0001" }, payload: { ...body, fullName: "Someone Else" } });
  assert.equal(conflict.statusCode, 409);
  const early = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "asha@example.com", password: body.password } });
  assert.equal(early.json().error.code, "EMAIL_NOT_VERIFIED");
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/verify-email", payload: { token } })).statusCode, 200);
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/verify-email", payload: { token } })).statusCode, 400);
  const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "ASHA@example.com ", password: body.password } });
  assert.equal(login.statusCode, 200);
  const cookie = String(login.headers["set-cookie"]).split(";")[0]!;
  const me = await app.inject({ method: "GET", url: "/api/v1/account/me", headers: { cookie } });
  assert.equal(me.json().data.user.role, "owner");
  assert.equal(me.json().data.business.trade_name, "Spice Route");
  const again = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { "idempotency-key": "reg-0002" }, payload: body });
  assert.equal(again.statusCode, 202, "an email already registered is not disclosed");
  assert.equal(one(db, "SELECT count(*) AS n FROM users")!.n, 1);
  await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie } });
  assert.equal((await app.inject({ method: "GET", url: "/api/v1/account/me", headers: { cookie } })).statusCode, 401);
  await app.close();
});

test("password reset signs every session out", async () => {
  const db = openDatabase(":memory:");
  const app = buildSaasApp({ db, signer });
  const cookie = await signedUp(app, "ravi@example.com");
  const token = await emailedToken(() => app.inject({ method: "POST", url: "/api/v1/auth/forgot-password", payload: { email: "ravi@example.com" } }));
  const reset = await app.inject({ method: "POST", url: "/api/v1/auth/reset-password", payload: { token, newPassword: "another-long-password" } });
  assert.equal(reset.statusCode, 200);
  assert.equal((await app.inject({ method: "GET", url: "/api/v1/account/me", headers: { cookie } })).statusCode, 401);
  assert.equal((await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "ravi@example.com", password: "another-long-password" } })).statusCode, 200);
  await app.close();
});

test("licence keys over HTTP: none without a trial; a trial key for the PC; listed; revoked; public key published", async () => {
  const db = openDatabase(":memory:");
  const app = buildSaasApp({ db, signer });
  const cookie = await signedUp(app, "meena@example.com");
  const { outlet, org } = one<{ outlet: string; org: string }>(db, "SELECT o.id AS outlet, o.organization_id AS org FROM outlets o")!;
  const ask = () => app.inject({ method: "POST", url: `/api/v1/outlets/${outlet}/licences`, headers: { cookie }, payload: { productCode: "fine_dine", hardwareId: HW } });
  assert.equal((await ask()).json().error.code, "NO_SUBSCRIPTION");
  // what the trial provisioning worker will do: start the trial
  exec(db, "UPDATE subscriptions SET status = 'trialing', trial_start_at = ?, trial_end_at = ? WHERE organization_id = ?", isoIn(-60_000), isoIn(14 * 86_400_000), org);
  const issued = await ask();
  assert.equal(issued.statusCode, 201);
  const licence = issued.json().data.licence;
  const trusted = [{ id: "cloud", publicKey: publicKeyFromBase64(pair.publicKeyBase64), maxDays: 400 }];
  assert.equal(verifyKey(licence.key, trusted, HW, { product: "fine_dine" }).ok, true);
  assert.equal((await ask()).statusCode, 200, "asking again returns the same key");
  const list = await app.inject({ method: "GET", url: "/api/v1/licences", headers: { cookie } });
  assert.deepEqual(list.json().data.licences.map((l: { id: string }) => l.id), [licence.id]);
  const revoked = await app.inject({ method: "POST", url: `/api/v1/licences/${licence.id}/revoke`, headers: { cookie }, payload: { reason: "new PC" } });
  assert.equal(revoked.json().data.licence.status, "revoked");
  assert.equal((await app.inject({ method: "GET", url: "/api/v1/licences" })).statusCode, 401);
  assert.equal((await app.inject({ method: "POST", url: `/api/v1/outlets/${newId()}/licences`, headers: { cookie }, payload: { productCode: "fine_dine", hardwareId: HW } })).statusCode, 404);
  const keys = await app.inject({ method: "GET", url: "/api/v1/licensing/public-keys" });
  assert.deepEqual(keys.json().data.keys, [{ kid: "cloud", publicKey: pair.publicKeyBase64, maxDays: 400 }]);
  await app.close();
});

test("without a signing key the API still runs and says keys are unavailable", async () => {
  const db = openDatabase(":memory:");
  const app = buildSaasApp({ db, signer: null });
  const cookie = await signedUp(app, "vikram@example.com");
  const outlet = one<{ id: string }>(db, "SELECT id FROM outlets")!.id;
  const r = await app.inject({ method: "POST", url: `/api/v1/outlets/${outlet}/licences`, headers: { cookie }, payload: { productCode: "fine_dine", hardwareId: HW } });
  assert.equal(r.statusCode, 503);
  assert.deepEqual((await app.inject({ method: "GET", url: "/api/v1/licensing/public-keys" })).json().data.keys, []);
  await app.close();
});
