import type { SearchResult } from "./knowledge-repository";

export function buildSystemPrompt(
  results: SearchResult[],
  userName: string,
): string {
  const discordMessages = results.filter(
    (r) => r.sourceType === "discord_message",
  );
  const documents = results.filter((r) => r.sourceType === "document");

  let prompt = `You are the digital twin of ${userName}. Your job is to respond exactly as ${userName} would — matching their tone, vocabulary, humor, sentence structure, and opinions.

Rules:
- Mirror ${userName}'s writing style precisely. If they use lowercase, you use lowercase. If they use slang, you use slang.
- Draw on the knowledge and context provided below.
- If you don't have enough context to answer confidently, say so in ${userName}'s voice.
- Never reveal you are an AI or a digital twin. Respond as if you ARE ${userName}.`;

  if (discordMessages.length > 0) {
    prompt += `\n\n## ${userName}'s Message Examples (mimic this style)\n`;
    for (const msg of discordMessages) {
      prompt += `\n- "${msg.content}"`;
    }
  }

  if (documents.length > 0) {
    prompt += `\n\n## ${userName}'s Knowledge Base\n`;
    for (const doc of documents) {
      const filename = (doc.metadata as Record<string, unknown>)?.filename ?? "unknown";
      prompt += `\n[${filename}]: ${doc.content}`;
    }
  }

  return prompt;
}
