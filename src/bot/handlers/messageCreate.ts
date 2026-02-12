import { streamText, getModel } from "@/libs/ai";
import { stripMention, createStreamEditor } from "@/libs/discord";
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

  const reply = await message.reply("...");
  const editor = createStreamEditor(reply);

  try {
    let userId: string;
    let guildId: string | undefined;
    let userName: string;

    if (message.guild) {
      const owner = await getGuildOwner(message.guild.id);
      if (!owner) {
        await reply.edit(
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
        await reply.edit("Bot not configured yet. Run ingestion first.");
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

    const { textStream } = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    for await (const chunk of textStream) {
      editor.append(chunk);
    }

    await editor.finalize();
  } catch (error) {
    console.error("Error handling message:", error);
    await reply.edit("Something went wrong. Try again later.");
  }
}
