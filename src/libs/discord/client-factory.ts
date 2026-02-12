import { Client, GatewayIntentBits, Partials } from "discord.js";

interface CreateDiscordClientOptions {
  directMessages?: boolean;
}

export function createDiscordClient(opts: CreateDiscordClientOptions = {}) {
  const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ];

  const partials: Partials[] = [];

  if (opts.directMessages) {
    intents.push(GatewayIntentBits.DirectMessages);
    partials.push(Partials.Channel);
  }

  return new Client({ intents, partials });
}
