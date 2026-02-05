import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const contentDir = path.join(process.cwd(), "content/ratgeber");
const outDir = path.join(process.cwd(), "public/ratgeber/og");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickFontSize(title) {
  const length = title.length;
  if (length > 95) return 44;
  if (length > 80) return 48;
  if (length > 65) return 52;
  return 58;
}

function wrapTitle(title, fontSize) {
  const maxWidth = 900;
  const avgCharWidth = fontSize * 0.55;
  const maxChars = Math.max(18, Math.floor(maxWidth / avgCharWidth));
  const words = title.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= 3) return lines;

  const trimmed = lines.slice(0, 3);
  const last = trimmed[2];
  trimmed[2] = last.length > 3 ? `${last.slice(0, Math.max(0, last.length - 1))}…` : `${last}…`;
  return trimmed;
}

function buildSvg({ title }) {
  const fontSize = pickFontSize(title);
  const lines = wrapTitle(title, fontSize);
  const lineHeight = Math.round(fontSize * 1.12);
  const tspanLines = lines
    .map((line, index) => {
      const safeLine = escapeHtml(line);
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x=\"136\" dy=\"${dy}\">${safeLine}</tspan>`;
    })
    .join("");

  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${WIDTH}\" height=\"${HEIGHT}\" viewBox=\"0 0 ${WIDTH} ${HEIGHT}\">
  <defs>
    <radialGradient id=\"bg1\" cx=\"85%\" cy=\"25%\" r=\"60%\">
      <stop offset=\"0%\" stop-color=\"rgba(59,130,246,0.18)\" />
      <stop offset=\"100%\" stop-color=\"rgba(11,15,26,0)\" />
    </radialGradient>
    <radialGradient id=\"bg2\" cx=\"20%\" cy=\"80%\" r=\"60%\">
      <stop offset=\"0%\" stop-color=\"rgba(14,165,233,0.18)\" />
      <stop offset=\"100%\" stop-color=\"rgba(11,15,26,0)\" />
    </radialGradient>
    <radialGradient id=\"bg3\" cx=\"10%\" cy=\"15%\" r=\"65%\">
      <stop offset=\"0%\" stop-color=\"rgba(99,102,241,0.14)\" />
      <stop offset=\"100%\" stop-color=\"rgba(11,15,26,0)\" />
    </radialGradient>
    <radialGradient id=\"blob1\" cx=\"30%\" cy=\"30%\" r=\"70%\">
      <stop offset=\"0%\" stop-color=\"rgba(124,58,237,0.8)\" />
      <stop offset=\"100%\" stop-color=\"rgba(59,130,246,0.3)\" />
    </radialGradient>
    <radialGradient id=\"blob2\" cx=\"30%\" cy=\"30%\" r=\"70%\">
      <stop offset=\"0%\" stop-color=\"rgba(14,165,233,0.8)\" />
      <stop offset=\"100%\" stop-color=\"rgba(59,130,246,0.2)\" />
    </radialGradient>
    <radialGradient id=\"blob3\" cx=\"40%\" cy=\"40%\" r=\"70%\">
      <stop offset=\"0%\" stop-color=\"rgba(16,185,129,0.4)\" />
      <stop offset=\"100%\" stop-color=\"rgba(14,165,233,0.2)\" />
    </radialGradient>
    <linearGradient id=\"cardBg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
      <stop offset=\"0%\" stop-color=\"rgba(17,24,39,0.95)\" />
      <stop offset=\"100%\" stop-color=\"rgba(15,23,42,0.85)\" />
    </linearGradient>
    <linearGradient id=\"miniBg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
      <stop offset=\"0%\" stop-color=\"rgba(30,41,59,0.9)\" />
      <stop offset=\"100%\" stop-color=\"rgba(15,23,42,0.6)\" />
    </linearGradient>
    <linearGradient id=\"miniLine\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">
      <stop offset=\"0%\" stop-color=\"rgba(59,130,246,0.8)\" />
      <stop offset=\"100%\" stop-color=\"rgba(14,165,233,0.2)\" />
    </linearGradient>
    <filter id=\"softBlur\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\">
      <feGaussianBlur stdDeviation=\"40\" />
    </filter>
    <filter id=\"shadow\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\">
      <feDropShadow dx=\"0\" dy=\"18\" stdDeviation=\"28\" flood-color=\"rgba(0,0,0,0.55)\" />
    </filter>
  </defs>

  <rect width=\"1200\" height=\"630\" fill=\"#0b0f1a\" />
  <rect width=\"1200\" height=\"630\" fill=\"url(#bg1)\" />
  <rect width=\"1200\" height=\"630\" fill=\"url(#bg2)\" />
  <rect width=\"1200\" height=\"630\" fill=\"url(#bg3)\" />

  <ellipse cx=\"100\" cy=\"220\" rx=\"180\" ry=\"180\" fill=\"url(#blob1)\" filter=\"url(#softBlur)\" opacity=\"0.8\" />
  <ellipse cx=\"1120\" cy=\"360\" rx=\"210\" ry=\"210\" fill=\"url(#blob2)\" filter=\"url(#softBlur)\" opacity=\"0.75\" />
  <ellipse cx=\"520\" cy=\"610\" rx=\"160\" ry=\"160\" fill=\"url(#blob3)\" filter=\"url(#softBlur)\" opacity=\"0.65\" />

  <g filter=\"url(#shadow)\">
    <rect x=\"80\" y=\"110\" width=\"980\" height=\"360\" rx=\"36\" fill=\"url(#cardBg)\" stroke=\"rgba(148,163,184,0.25)\" stroke-width=\"1\" />
  </g>

  <text x=\"136\" y=\"168\" fill=\"rgba(165,180,252,0.9)\" font-size=\"12\" font-weight=\"700\" letter-spacing=\"4\" font-family=\"SF Pro Display, Segoe UI, Helvetica Neue, Arial, sans-serif\">
    Ratgeber · BFSG &amp; Barrierefreiheit
  </text>

  <text x=\"136\" y=\"230\" fill=\"#f8fafc\" font-size=\"${fontSize}\" font-weight=\"800\" font-family=\"SF Pro Display, Segoe UI, Helvetica Neue, Arial, sans-serif\">
    ${tspanLines}
  </text>

  <text x=\"136\" y=\"410\" fill=\"rgba(148,163,184,0.9)\" font-size=\"16\" font-weight=\"600\" font-family=\"SF Pro Display, Segoe UI, Helvetica Neue, Arial, sans-serif\">
    bfsg.vercel.app
  </text>

  <g>
    <rect x=\"870\" y=\"420\" width=\"220\" height=\"90\" rx=\"24\" fill=\"url(#miniBg)\" stroke=\"rgba(148,163,184,0.2)\" stroke-width=\"1\" />
    <rect x=\"894\" y=\"446\" width=\"120\" height=\"8\" rx=\"4\" fill=\"url(#miniLine)\" />
    <rect x=\"870\" y=\"520\" width=\"220\" height=\"90\" rx=\"24\" fill=\"url(#miniBg)\" stroke=\"rgba(148,163,184,0.2)\" stroke-width=\"1\" />
    <rect x=\"894\" y=\"546\" width=\"120\" height=\"8\" rx=\"4\" fill=\"url(#miniLine)\" />
  </g>
</svg>`;
}

function updateFrontmatter(filePath, data, content) {
  const updated = matter.stringify(content, data, { lineWidth: 0 });
  fs.writeFileSync(filePath, updated);
}

const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".md"));
if (files.length === 0) {
  console.error("No markdown files found in content/ratgeber");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const fullPath = path.join(contentDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const title = String(data.title || slug);
  const ogImage = `/ratgeber/og/${slug}.png`;
  const ogImageAlt = `Illustration zum Ratgeber: ${title}`;

  const svg = buildSvg({ title });
  const outPath = path.join(outDir, `${slug}.png`);
  await sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT)
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const nextData = { ...data, ogImage, ogImageAlt };
  updateFrontmatter(fullPath, nextData, content);

  console.log(`Generated ${outPath}`);
}
