// Shared helpers for build + generate.
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.resolve(__dirname, "..");
const WORKS_DIR = path.join(ROOT, "content", "works");

// slugify for tags + filenames: lowercase, non-alphanumeric -> hyphen
function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Read every entry file (skip files starting with "_").
function loadEntries() {
  if (!fs.existsSync(WORKS_DIR)) return [];
  return fs
    .readdirSync(WORKS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md")
    .map((f) => {
      const full = path.join(WORKS_DIR, f);
      const raw = fs.readFileSync(full, "utf8");
      const parsed = matter(raw);
      return {
        slug: f.replace(/\.md$/, ""),
        file: full,
        data: parsed.data || {},
        body: parsed.content || "",
      };
    });
}

// Split a generated body into { review, spoiler } using the SPOILER markers.
function splitBody(body) {
  const m = body.match(/<!--SPOILER-->([\s\S]*?)<!--\/SPOILER-->/);
  if (!m) return { review: body.trim(), spoiler: "" };
  const spoiler = m[1].trim();
  const review = body.slice(0, m.index).trim();
  return { review, spoiler };
}

// Write a body back with optional spoiler wall.
function joinBody(review, spoiler) {
  let out = (review || "").trim() + "\n";
  if (spoiler && spoiler.trim()) {
    out += `\n<!--SPOILER-->\n${spoiler.trim()}\n<!--/SPOILER-->\n`;
  }
  return out;
}

// Persist updated frontmatter + body back to the entry file.
function writeEntry(entry, newData, newBody) {
  const file = matter.stringify(newBody, newData);
  fs.writeFileSync(entry.file, file, "utf8");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  ROOT,
  WORKS_DIR,
  slugify,
  loadEntries,
  splitBody,
  joinBody,
  writeEntry,
  escapeHtml,
};
