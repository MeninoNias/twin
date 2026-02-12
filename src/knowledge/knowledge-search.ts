import { KnowledgeRepository, type SearchResult } from "./knowledge-repository";

const repository = new KnowledgeRepository();

export { type SearchResult };

export async function searchKnowledge(
  query: string,
  opts: { limit?: number; sourceType?: "discord_message" | "document" } = {},
): Promise<SearchResult[]> {
  return repository.search(query, opts);
}
