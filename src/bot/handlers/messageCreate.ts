import { generateText, getModel } from "@/libs/ai";
import { stripMention, splitMessage } from "@/libs/discord";
import type { Message } from "@/libs/discord";
import {
  searchKnowledge,
  getGuildOwner,
  getUserByDiscordId,
} from "@/knowledge/knowledge-search";
import { buildSystemPrompt } from "@/knowledge/prompt-builder";
import { env } from "@/env";
import { client } from "../client";

function shouldRespond(message: Message): boolean {
  if (message.author.bot) return false;

  // Respond to DMs
  if (!message.guild) return true;

  // Respond when the bot is mentioned
  if (client.user && message.mentions.has(client.user)) return true;

  return false;
}

export async function handleMessageCreate(message: Message) {
  if (!shouldRespond(message)) return;

  const botId = client.user?.id ?? "";
  const query = stripMention(message.content, botId);
  if (!query) return;

  try {
    let userId: string;
    let guildId: string | undefined;
    let userName: string;

    if (message.guild) {
      const owner = await getGuildOwner(message.guild.id);
      if (!owner) {
        await message.reply(
          "This guild hasn't been set up yet. Run ingestion first.",
        );
        return;
      }
      userId = owner.userId;
      guildId = owner.guildId;
      userName = owner.displayName;
    } else {
      // DM fallback — use DISCORD_USER_ID
      const user = await getUserByDiscordId(env.DISCORD_USER_ID);
      if (!user) {
        await message.reply("Bot not configured yet. Run ingestion first.");
        return;
      }
      userId = user.id;
      userName = user.displayName;
    }

    const results = await searchKnowledge(query, {
      userId,
      guildId,
      limit: 20,
    });
    const systemPrompt = buildSystemPrompt(results, userName);

    const { text } = await generateText({
      model: getModel(),
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    for (const part of splitMessage(text)) {
      await message.reply(part);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    await message.reply("Something went wrong. Try again later.");
  }
}
