import {
  db,
  sql,
  knowledgeBase,
  type KnowledgeBaseRecord,
} from "@/libs/drizzle";
import { embedText } from "@/libs/ai";
import { BaseRepository } from "@/shared/base-repository";

export type SearchResult = KnowledgeBaseRecord & { similarity: number };

export class KnowledgeRepository extends BaseRepository<typeof knowledgeBase> {
  constructor() {
    super(db, knowledgeBase);
  }

  async search(
    query: string,
    opts: { limit?: number; sourceType?: "discord_message" | "document" } = {},
  ): Promise<SearchResult[]> {
    const { limit = 20, sourceType } = opts;
    const queryEmbedding = await embedText(query);

    const similarity = sql<number>`1 - (${knowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

    const conditions = [sql`1=1`];
    if (sourceType) {
      conditions.push(
        sql`${knowledgeBase.sourceType} = ${sourceType}`,
      );
    }

    const results = await this.db
      .select({
        id: knowledgeBase.id,
        content: knowledgeBase.content,
        embedding: knowledgeBase.embedding,
        sourceType: knowledgeBase.sourceType,
        metadata: knowledgeBase.metadata,
        createdAt: knowledgeBase.createdAt,
        similarity,
      })
      .from(knowledgeBase)
      .where(sql.join(conditions, sql` AND `))
      .orderBy(sql`${knowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(limit);

    return results as SearchResult[];
  }
}
