export function parseIgHandle(raw: string): string {
  const m = raw.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) return m[1].replace(/^@/, '');
  return raw.replace(/^@/, '').trim();
}

export function parseYtHandle(raw: string): string {
  const m =
    raw.match(/youtube\.com\/@([^/?#\s]+)/i) ||
    raw.match(/youtube\.com\/c\/([^/?#\s]+)/i) ||
    raw.match(/youtube\.com\/user\/([^/?#\s]+)/i);
  if (m) return m[1];
  return raw.replace(/^@/, '').trim();
}
