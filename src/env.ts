import { z } from "zod";

const envSchema = z
  .object({
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_USER_ID: z.string().min(1),
    DATABASE_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    LLM_PROVIDER: z.enum(["anthropic", "google"]).default("anthropic"),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PROVIDER === "anthropic" && !data.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ANTHROPIC_API_KEY is required when LLM_PROVIDER is 'anthropic'",
        path: ["ANTHROPIC_API_KEY"],
      });
    }
    if (data.LLM_PROVIDER === "google" && !data.GOOGLE_GENERATIVE_AI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GOOGLE_GENERATIVE_AI_API_KEY is required when LLM_PROVIDER is 'google'",
        path: ["GOOGLE_GENERATIVE_AI_API_KEY"],
      });
    }
  });

export const env = envSchema.parse(process.env);
