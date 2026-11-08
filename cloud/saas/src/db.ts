// The SaaS database: one SQLite file through node:sqlite, the same engine and settings as DinePOS Cloud's hub (WAL,
// synchronous FULL, foreign keys on). This API is its only writer. Times are UTC ISO-8601 text with milliseconds, so
// they sort and compare as text.
import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { fileURLToPath } from "node:url";

export type Db = DatabaseSync;
export type Row = Record<string, any>;

export const migrationsDir = fileURLToPath(new URL("../../../packages/saas-db/migrations/", import.meta.url));

/** Opens (and creates) the database, then applies any migrations it has not had yet. `:memory:` for tests. */
export function openDatabase(file: string): Db {
  if (file !== ":memory:") mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

/** Applies `NNNN_name.sql` files in order, each in its own transaction, once (recorded in saas_schema_migrations). */
export function migrate(db: Db, dir = migrationsDir): string[] {
  db.exec("CREATE TABLE IF NOT EXISTS saas_schema_migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const applied: string[] = [];
  for (const filename of readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()) {
    if (one(db, "SELECT 1 AS x FROM saas_schema_migrations WHERE filename = ?", filename)) continue;
    tx(db, () => {
      db.exec(readFileSync(path.join(dir, filename), "utf8"));
      exec(db, "INSERT INTO saas_schema_migrations (filename, applied_at) VALUES (?, ?)", filename, nowIso());
    });
    applied.push(filename);
  }
  return applied;
}

export const nowIso = (at: Date = new Date()) => at.toISOString();
export const isoIn = (ms: number, from: Date = new Date()) => new Date(from.getTime() + ms).toISOString();
export const newId = () => randomUUID();

const params = (values: unknown[]): SQLInputValue[] =>
  values.map((v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v instanceof Date ? v.toISOString() : (v as SQLInputValue)));

export function one<T = Row>(db: Db, sql: string, ...values: unknown[]): T | undefined {
  return db.prepare(sql).get(...params(values)) as T | undefined;
}
export function many<T = Row>(db: Db, sql: string, ...values: unknown[]): T[] {
  return db.prepare(sql).all(...params(values)) as T[];
}
export function exec(db: Db, sql: string, ...values: unknown[]): { changes: number } {
  const r = db.prepare(sql).run(...params(values));
  return { changes: Number(r.changes) };
}

/** One write transaction (BEGIN IMMEDIATE: writers queue up front, so read-then-write inside is safe). */
export function tx<T>(db: Db, work: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* already rolled back by SQLite */ }
    throw error;
  }
}

/** A UNIQUE constraint failed (the SQLite counterpart of PostgreSQL's 23505). */
export const isUniqueViolation = (error: unknown) => /UNIQUE constraint failed/i.test(String((error as { message?: unknown })?.message ?? ""));
