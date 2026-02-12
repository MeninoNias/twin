import { readdir, readFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { KnowledgeRepository } from "@/knowledge/knowledge-repository";
import { chunkText } from "@/knowledge/chunker";
import { BaseIngestionService } from "@/shared/base-ingestion-service";
import type { IngestionItem } from "@/shared/types";

class DocumentLoaderService extends BaseIngestionService {
  constructor(private readonly dirPath: string) {
    super(new KnowledgeRepository());
  }

  async *extract(): AsyncGenerator<IngestionItem[]> {
    const files = await readdir(this.dirPath);
    const supportedExts = [".md", ".txt"];

    const docFiles = files.filter((f) =>
      supportedExts.includes(extname(f).toLowerCase()),
    );

    if (docFiles.length === 0) {
      console.error(`No supported files found in ${this.dirPath}`);
      process.exit(1);
    }

    console.log(`Found ${docFiles.length} document(s) to ingest.`);

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
      }));

      yield items;
    }
  }
}

// Usage: bun run src/ingestion/document-loader.ts <directory>
const dirPath = process.argv[2];
if (!dirPath) {
  console.error("Usage: bun run src/ingestion/document-loader.ts <directory>");
  process.exit(1);
}

const service = new DocumentLoaderService(dirPath);
service.run().then(() => process.exit(0));
