const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => entities[char] ?? char);

export const fitText = (value: string, maxWidth: number, fontSize: number): string => {
  const limit = Math.max(1, Math.floor(maxWidth / (fontSize * 0.56)));
  return value.length > limit ? `${value.slice(0, Math.max(1, limit - 1)).trimEnd()}…` : value;
};
