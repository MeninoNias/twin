import { readdir, readFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { KnowledgeRepository } from "@/knowledge/knowledge-repository";
import { chunkText } from "@/knowledge/chunker";
import { BaseIngestionService } from "@/shared/base-ingestion-service";
import type { IngestionItem } from "@/shared/types";

class DocumentLoaderService extends BaseIngestionService {
  private userId!: string;

  constructor(
    private readonly dirPath: string,
    private readonly userDiscordId: string,
    private readonly repo: KnowledgeRepository,
  ) {
    super(repo);
  }

  async *extract(): AsyncGenerator<IngestionItem[]> {
    // Upsert user (display name updated on next Discord interaction)
    this.userId = await this.repo.upsertUser(
      this.userDiscordId,
      this.userDiscordId,
    );

    const files = await readdir(this.dirPath);
    const supportedExts = [".md", ".txt"];

    const docFiles = files.filter((f) =>
      supportedExts.includes(extname(f).toLowerCase()),
    );

    if (docFiles.length === 0) {
      console.error(`No supported files found in ${this.dirPath}`);
      process.exit(1);
    }

    console.log(
      `Found ${docFiles.length} document(s) to ingest for user ${this.userDiscordId}.`,
    );

    for (const file of docFiles) {
      const filePath = join(this.dirPath, file);
      const content = await readFile(filePath, "utf-8");
      const chunks = chunkText(content);

      console.log(`  ${file}: ${chunks.length} chunk(s)`);

      const items: IngestionItem[] = chunks.map((c) => ({
        content: c.text,
        sourceType: "document" as const,
        metadata: {
          filename: basename(file),
          chunkIndex: c.index,
          totalChunks: chunks.length,
        },
        userId: this.userId,
      }));

      yield items;
    }
  }
}

// Usage: bun run src/ingestion/document-loader.ts <directory> <userDiscordId>
const dirPath = process.argv[2];
const userDiscordId = process.argv[3];
if (!dirPath || !userDiscordId) {
  console.error(
    "Usage: bun run src/ingestion/document-loader.ts <directory> <userDiscordId>",
  );
  process.exit(1);
}

const repo = new KnowledgeRepository();
const service = new DocumentLoaderService(dirPath, userDiscordId, repo);
service.run().then(() => process.exit(0));
