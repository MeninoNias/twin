import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/libs/drizzle/schemas",
  out: "./src/libs/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
