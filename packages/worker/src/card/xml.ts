const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => entities[char] ?? char);

const asciiWidths = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const widthOfChar = (char: string): number => {
  const code = char.codePointAt(0) ?? 0;
  if (code >= 32 && code <= 126) {
    return (asciiWidths[code - 32] ?? 556) / 1000;
  }
  if (code >= 0x2e80) {
    return 1;
  }
  return code >= 0x410 && code <= 0x42f ? 0.7 : 0.58;
};

const boldFactor = 1.05;

export const fitText = (
  value: string,
  maxWidth: number,
  fontSize: number,
  weight = 400,
): string => {
  const scale = fontSize * (weight >= 600 ? boldFactor : 1);
  const chars = Array.from(value);
  const total = chars.reduce((sum, char) => sum + widthOfChar(char) * scale, 0);
  if (total <= maxWidth) {
    return value;
  }
  const room = maxWidth - widthOfChar('…') * scale;
  let used = 0;
  let count = 0;
  for (const char of chars) {
    used += widthOfChar(char) * scale;
    if (used > room) {
      break;
    }
    count += 1;
  }
  return `${chars.slice(0, Math.max(1, count)).join('').trimEnd()}…`;
};
