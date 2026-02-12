export { db, type Database } from "./client";
export {
  knowledgeBase,
  sourceTypeEnum,
  type KnowledgeBaseRecord,
  type NewKnowledgeBaseRecord,
} from "./schema";
export { runMigrations } from "./migrate";
export { sql } from "drizzle-orm";
export type { PgTable, TableConfig } from "drizzle-orm/pg-core";
export type { InferInsertModel } from "drizzle-orm";
