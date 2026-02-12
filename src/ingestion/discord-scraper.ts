import { env } from "@/env";
import { createDiscordClient, TextChannel } from "@/libs/discord";
import { KnowledgeRepository } from "@/knowledge/knowledge-repository";
import { BaseIngestionService } from "@/shared/base-ingestion-service";
import type { IngestionItem } from "@/shared/types";

class DiscordScraperService extends BaseIngestionService {
  private userId!: string;
  private guildId!: string;

  constructor(
    private readonly channelId: string,
    private readonly repo: KnowledgeRepository,
  ) {
    super(repo);
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

    const guild = channel.guild;
    const member = await guild.members.fetch(env.DISCORD_USER_ID);

    // Upsert user and guild so the bot knows who owns this guild
    this.userId = await this.repo.upsertUser(
      env.DISCORD_USER_ID,
      member.displayName,
    );
    this.guildId = await this.repo.upsertGuild(
      guild.id,
      guild.name,
      this.userId,
    );

    console.log(
      `Scraping #${channel.name} for messages by ${member.displayName}...`,
    );

    let lastId: string | undefined;

    while (true) {
      const messages = await channel.messages.fetch({
        limit: 100,
        ...(lastId ? { before: lastId } : {}),
      });

      if (messages.size === 0) break;

      const items: IngestionItem[] = messages
        .filter(
          (m) =>
            m.author.id === env.DISCORD_USER_ID && m.content.length > 10,
        )
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
          userId: this.userId,
          guildId: this.guildId,
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

const repo = new KnowledgeRepository();
const service = new DiscordScraperService(channelId, repo);
service.run().then(() => process.exit(0));
