export interface IngestionMetadata {
  [key: string]: unknown;
}

export interface IngestionItem {
  content: string;
  sourceType: "discord_message" | "document";
  metadata: IngestionMetadata;
}
