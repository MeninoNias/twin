export { db, type Database } from "./client";
export {
  users,
  type User,
  type NewUser,
  guilds,
  type Guild,
  type NewGuild,
  knowledgeBase,
  sourceTypeEnum,
  type KnowledgeBaseRecord,
  type NewKnowledgeBaseRecord,
} from "./schemas";
export { runMigrations } from "./migrate";
export { sql, eq, and, or, isNull } from "drizzle-orm";
export type { PgTable, TableConfig } from "drizzle-orm/pg-core";
export type { InferInsertModel } from "drizzle-orm";
