import fs from "node:fs";
import path from "node:path";

export function listRatgeberSlugs(): string[] {
  const dir = path.join(process.cwd(), "content/ratgeber");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .filter(Boolean);
}
