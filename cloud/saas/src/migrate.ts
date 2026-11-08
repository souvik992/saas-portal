// Applies any SaaS database migrations not applied yet (the API also does this when it starts).
import { config } from "./config.js";
import { openDatabase } from "./db.js";

try {
  const db = openDatabase(config.SAAS_DB_PATH);
  const applied = db.prepare("SELECT filename FROM saas_schema_migrations ORDER BY filename").all() as { filename: string }[];
  console.info(`SaaS database ${config.SAAS_DB_PATH}: ${applied.map((m) => m.filename).join(", ") || "no migrations"}`);
  db.close();
} catch (error) {
  console.error("SaaS migration failed", error);
  process.exitCode = 1;
}
