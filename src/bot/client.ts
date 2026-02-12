import { createDiscordClient } from "@/libs/discord";

export const client = createDiscordClient({ directMessages: true });
