import { streamText, getModel } from "@/libs/ai";
import { stripMention, createStreamEditor } from "@/libs/discord";
import type { Message } from "@/libs/discord";
import { searchKnowledge } from "@/knowledge/knowledge-search";
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
    const results = await searchKnowledge(query, { limit: 20 });
    const userName = message.guild
      ? (await message.guild.members.fetch(env.DISCORD_USER_ID)).displayName
      : "User";

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
