import { join } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client";

const migrationsFolder = join(import.meta.dir, "migrations");

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}

// Auto-run when executed as a script
await runMigrations();
console.log("Migrations applied successfully.");
process.exit(0);
