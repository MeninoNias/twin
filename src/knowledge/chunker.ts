export interface Chunk {
  text: string;
  index: number;
}

export function chunkText(
  text: string,
  opts: { maxChunkSize?: number; overlap?: number } = {},
): Chunk[] {
  const { maxChunkSize = 1000, overlap = 200 } = opts;
  const chunks: Chunk[] = [];

  if (text.length <= maxChunkSize) {
    return [{ text, index: 0 }];
  }

  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    if (end < text.length) {
      // Try to break at a paragraph, then sentence, then word boundary
      const slice = text.slice(start, end);
      const paraBreak = slice.lastIndexOf("\n\n");
      const sentenceBreak = slice.lastIndexOf(". ");
      const wordBreak = slice.lastIndexOf(" ");

      if (paraBreak > maxChunkSize * 0.5) {
        end = start + paraBreak + 2;
      } else if (sentenceBreak > maxChunkSize * 0.3) {
        end = start + sentenceBreak + 2;
      } else if (wordBreak > 0) {
        end = start + wordBreak + 1;
      }
    }

    chunks.push({ text: text.slice(start, end).trim(), index });
    index++;
    start = end - overlap;
  }

  return chunks;
}
