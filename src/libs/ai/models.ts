import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { env } from "@/env";

export function getModel() {
  switch (env.LLM_PROVIDER) {
    case "anthropic":
      return anthropic("claude-sonnet-4-20250514");
    case "google":
      return google("gemini-2.0-flash");
  }
}
