export function normalizeUrl(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // Already absolute
  if (/^https?:\/\//i.test(raw)) return raw;

  // Protocol-relative
  if (raw.startsWith("//")) return `https:${raw}`;

  // Accept "www.example.com" or "example.com" and default to https
  return `https://${raw}`;
}

export function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
