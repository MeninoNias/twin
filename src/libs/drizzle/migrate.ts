import { join } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client";

const migrationsFolder = join(import.meta.dir, "migrations");

export async function runMigrations() {
  console.log(`Running migrations from ${migrationsFolder}...`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully.");
}

// Auto-run when executed as a script
if (import.meta.main) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
