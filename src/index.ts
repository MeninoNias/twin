import { env } from "./env";
import { client } from "./bot/client";
import { handleMessageCreate } from "./bot/handlers/messageCreate";

client.on("messageCreate", handleMessageCreate);

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(env.DISCORD_TOKEN);
