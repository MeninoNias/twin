import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schemas";

function validateDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol "${parsed.protocol}" — expected postgres:// or postgresql://`);
    }
    if (!parsed.hostname) {
      throw new Error("Missing hostname in DATABASE_URL");
    }
    return url;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Invalid DATABASE_URL: ${url}`);
    }
    throw err;
  }
}

const client = postgres(validateDatabaseUrl(env.DATABASE_URL));
export const db = drizzle(client, { schema });

export type Database = typeof db;
