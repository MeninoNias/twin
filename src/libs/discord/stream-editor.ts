import type { Message } from "discord.js";
import { splitMessage } from "./message-utils";

const DEBOUNCE_MS = 1500;

export function createStreamEditor(replyMessage: Message) {
  let buffer = "";
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let followUps: Message[] = [];

  async function flush() {
    const parts = splitMessage(buffer);
    await replyMessage.edit(parts[0] || "...");

    for (let i = 1; i < parts.length; i++) {
      if (followUps[i - 1]) {
        await followUps[i - 1].edit(parts[i]);
      } else {
        const msg = await (replyMessage.channel as Extract<typeof replyMessage.channel, { send: Function }>).send(parts[i]);
        followUps.push(msg);
      }
    }
  }

  return {
    append(chunk: string) {
      buffer += chunk;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(flush, DEBOUNCE_MS);
    },
    async finalize() {
      if (timeout) clearTimeout(timeout);
      await flush();
    },
  };
}
