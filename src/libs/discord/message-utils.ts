const MAX_LENGTH = 1900;

export function splitMessage(text: string): string[] {
  if (text.length <= MAX_LENGTH) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_LENGTH) {
      parts.push(remaining);
      break;
    }

    let splitAt = remaining.lastIndexOf("\n", MAX_LENGTH);
    if (splitAt <= 0) splitAt = remaining.lastIndexOf(" ", MAX_LENGTH);
    if (splitAt <= 0) splitAt = MAX_LENGTH;

    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return parts;
}

export function stripMention(content: string, botId: string): string {
  return content.replace(new RegExp(`<@!?${botId}>`, "g"), "").trim();
}
