import { KnowledgeRepository, type SearchResult } from "./knowledge-repository";

const repository = new KnowledgeRepository();

export { type SearchResult };

export async function searchKnowledge(
  query: string,
  opts: {
    userId: string;
    guildId?: string;
    limit?: number;
    sourceType?: "discord_message" | "document";
  },
): Promise<SearchResult[]> {
  return repository.search(query, opts);
}

export async function getGuildOwner(guildDiscordId: string) {
  return repository.getGuildOwner(guildDiscordId);
}

export async function getUserByDiscordId(discordId: string) {
  return repository.getUserByDiscordId(discordId);
}

export async function upsertUser(discordId: string, displayName: string) {
  return repository.upsertUser(discordId, displayName);
}

export async function upsertGuild(
  discordId: string,
  name: string,
  ownerId: string,
) {
  return repository.upsertGuild(discordId, name, ownerId);
}
