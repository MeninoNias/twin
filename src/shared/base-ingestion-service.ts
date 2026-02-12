import { embedTexts } from "@/libs/ai";
import type { IngestionItem } from "./types";
import type { BaseRepository } from "./base-repository";
import type { PgTable, TableConfig } from "@/libs/drizzle";

const BATCH_SIZE = 50;

export abstract class BaseIngestionService {
  constructor(
    protected readonly repository: BaseRepository<PgTable<TableConfig>>,
  ) {}

  abstract extract(): AsyncIterable<IngestionItem[]>;

  async run(): Promise<void> {
    let totalIngested = 0;

    for await (const items of this.extract()) {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const texts = batch.map((item) => item.content);
        const embeddings = await embedTexts(texts);

        const rows = batch.map((item, idx) => ({
          content: item.content,
          embedding: embeddings[idx],
          sourceType: item.sourceType,
          metadata: item.metadata,
          userId: item.userId,
          guildId: item.guildId ?? null,
        }));

        await this.repository.insertMany(rows);
        totalIngested += rows.length;
        console.log(`  Ingested ${totalIngested} items...`);
      }
    }

    console.log(`Done. Total items ingested: ${totalIngested}`);
  }
}
