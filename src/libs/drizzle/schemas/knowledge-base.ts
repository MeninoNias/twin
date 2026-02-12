import {
  pgTable,
  uuid,
  text,
  pgEnum,
  jsonb,
  timestamp,
  index,
  vector,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { guilds } from "./guild";

export const sourceTypeEnum = pgEnum("source_type", [
  "discord_message",
  "document",
]);

export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    guildId: uuid("guild_id").references(() => guilds.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("kb_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("kb_source_type_idx").on(table.sourceType),
    index("kb_user_id_idx").on(table.userId),
    index("kb_guild_id_idx").on(table.guildId),
    index("kb_created_at_idx").on(table.createdAt),
  ],
);

export type KnowledgeBaseRecord = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeBaseRecord = typeof knowledgeBase.$inferInsert;
