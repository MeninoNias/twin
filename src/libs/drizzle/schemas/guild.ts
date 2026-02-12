import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user";

export const guilds = pgTable("guilds", {
  id: uuid("id").primaryKey().defaultRandom(),
  discordId: text("discord_id").notNull().unique(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Guild = typeof guilds.$inferSelect;
export type NewGuild = typeof guilds.$inferInsert;
