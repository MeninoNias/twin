import { env } from "@/env";
import { createDiscordClient, TextChannel } from "@/libs/discord";
import { KnowledgeRepository } from "@/knowledge/knowledge-repository";
import { BaseIngestionService } from "@/shared/base-ingestion-service";
import type { IngestionItem } from "@/shared/types";

class DiscordScraperService extends BaseIngestionService {
  constructor(private readonly channelId: string) {
    super(new KnowledgeRepository());
  }

  async *extract(): AsyncGenerator<IngestionItem[]> {
    const client = createDiscordClient();
    await client.login(env.DISCORD_TOKEN);
    console.log(`Logged in as ${client.user?.tag}`);

    const channel = await client.channels.fetch(this.channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error("Channel not found or not a text channel");
      client.destroy();
      process.exit(1);
    }

    console.log(`Scraping #${channel.name} for messages by ${env.DISCORD_USER_ID}...`);

    let lastId: string | undefined;

    while (true) {
      const messages = await channel.messages.fetch({
        limit: 100,
        ...(lastId ? { before: lastId } : {}),
      });

      if (messages.size === 0) break;

      const items: IngestionItem[] = messages
        .filter((m) => m.author.id === env.DISCORD_USER_ID && m.content.length > 10)
        .map((m) => ({
          content: m.content,
          sourceType: "discord_message" as const,
          metadata: {
            channelId: channel.id,
            channelName: channel.name,
            messageId: m.id,
            authorId: m.author.id,
            timestamp: m.createdAt.toISOString(),
          },
        }));

      if (items.length > 0) {
        yield items;
      }

      lastId = messages.last()?.id;
    }

    client.destroy();
  }
}

// Usage: bun run src/ingestion/discord-scraper.ts <channelId>
const channelId = process.argv[2];
if (!channelId) {
  console.error("Usage: bun run src/ingestion/discord-scraper.ts <channelId>");
  process.exit(1);
}

const service = new DiscordScraperService(channelId);
service.run().then(() => process.exit(0));
