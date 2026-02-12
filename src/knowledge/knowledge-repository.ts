import {
  db,
  sql,
  eq,
  and,
  or,
  isNull,
  knowledgeBase,
  users,
  guilds,
  type KnowledgeBaseRecord,
} from "@/libs/drizzle";
import { embedText } from "@/libs/ai";
import { BaseRepository } from "@/shared/base-repository";

export type SearchResult = KnowledgeBaseRecord & { similarity: number };

export class KnowledgeRepository extends BaseRepository<typeof knowledgeBase> {
  constructor() {
    super(db, knowledgeBase);
  }

  async upsertUser(discordId: string, displayName: string): Promise<string> {
    const [user] = await this.db
      .insert(users)
      .values({ discordId, displayName })
      .onConflictDoUpdate({
        target: users.discordId,
        set: { displayName },
      })
      .returning({ id: users.id });
    return user.id;
  }

  async upsertGuild(
    discordId: string,
    name: string,
    ownerId: string,
  ): Promise<string> {
    const [guild] = await this.db
      .insert(guilds)
      .values({ discordId, name, ownerId })
      .onConflictDoUpdate({
        target: guilds.discordId,
        set: { name, ownerId },
      })
      .returning({ id: guilds.id });
    return guild.id;
  }

  async getGuildOwner(
    guildDiscordId: string,
  ): Promise<{ userId: string; guildId: string; displayName: string } | null> {
    const result = await this.db
      .select({
        userId: users.id,
        guildId: guilds.id,
        displayName: users.displayName,
      })
      .from(guilds)
      .innerJoin(users, eq(guilds.ownerId, users.id))
      .where(eq(guilds.discordId, guildDiscordId))
      .limit(1);
    return result[0] ?? null;
  }

  async getUserByDiscordId(
    discordId: string,
  ): Promise<{ id: string; displayName: string } | null> {
    const result = await this.db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);
    return result[0] ?? null;
  }

  async search(
    query: string,
    opts: {
      userId: string;
      guildId?: string;
      limit?: number;
      sourceType?: "discord_message" | "document";
    },
  ): Promise<SearchResult[]> {
    const { userId, guildId, limit = 20, sourceType } = opts;
    const queryEmbedding = await embedText(query);

    const similarity = sql<number>`1 - (${knowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

    const conditions = [eq(knowledgeBase.userId, userId)];

    if (guildId) {
      conditions.push(
        or(
          eq(knowledgeBase.guildId, guildId),
          isNull(knowledgeBase.guildId),
        )!,
      );
    }

    if (sourceType) {
      conditions.push(eq(knowledgeBase.sourceType, sourceType));
    }

    const results = await this.db
      .select({
        id: knowledgeBase.id,
        content: knowledgeBase.content,
        embedding: knowledgeBase.embedding,
        sourceType: knowledgeBase.sourceType,
        metadata: knowledgeBase.metadata,
        userId: knowledgeBase.userId,
        guildId: knowledgeBase.guildId,
        createdAt: knowledgeBase.createdAt,
        similarity,
      })
      .from(knowledgeBase)
      .where(and(...conditions))
      .orderBy(
        sql`${knowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`,
      )
      .limit(limit);

    return results as SearchResult[];
  }
}
