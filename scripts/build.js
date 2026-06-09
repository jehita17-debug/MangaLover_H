// build.js — static site generator. Reads published entries, renders HTML to dist/.
//   node scripts/build.js
//
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const matter = require("gray-matter");
const cfg = require("./config");
const {
  ROOT,
  loadEntries,
  splitBody,
  slugify,
  escapeHtml,
} = require("./lib");

const DIST = path.join(ROOT, "dist");
const TPL = path.join(ROOT, "templates");
const YEAR = new Date().getFullYear();
const DASH = "—"; // em dash, kept as an escape to avoid encoding issues on write

const read = (p) => fs.readFileSync(p, "utf8");
const HEAD = read(path.join(TPL, "base-head.html"));
const FOOT = read(path.join(TPL, "base-foot.html"));
const T_WORK = read(path.join(TPL, "work.html"));
const T_INDEX = read(path.join(TPL, "index.html"));
const T_TAG = read(path.join(TPL, "tag.html"));

function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
}

function md(s) {
  return marked.parse(s || "");
}
function mdInline(s) {
  return marked.parseInline(s || "");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function write(rel, html) {
  const out = path.join(DIST, rel);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, html, "utf8");
}

function rootPrefix(depth) {
  return depth === 0 ? "" : "../".repeat(depth);
}

function moodNav(root) {
  return cfg.MOOD_DOORS.map(
    (m) =>
      `<a class="mood-chip" href="${root}tag/${slugify(m)}.html">${escapeHtml(m)}</a>`
  ).join("\n");
}

function page({ pageTitle, meta, canonical, ogType, root, bodyHtml }) {
  const head = fill(HEAD, {
    PAGE_TITLE: escapeHtml(pageTitle),
    META: escapeHtml(meta || ""),
    CANONICAL: canonical || cfg.SITE_URL,
    OG_TYPE: ogType || "website",
    ROOT: root,
    MOOD_NAV: moodNav(root),
  });
  const foot = fill(FOOT, { ROOT: root, YEAR });
  return head + bodyHtml + foot;
}

function renderWorkPage(e) {
  const d = e.data;
  const { review, spoiler } = splitBody(e.body);
  const root = rootPrefix(1);
  const tagsHtml = (d.genre_tags || [])
    .map(
      (t) =>
        `<a class="tag" href="${root}tag/${slugify(t)}.html">${escapeHtml(t)}</a>`
    )
    .join("");

  const ifLiked = d.if_you_liked
    ? `<div class="ifyouliked"><span class="lbl">If you liked&hellip;</span>${mdInline(
        d.if_you_liked
      )}</div>`
    : "";

  const spoilerHtml = spoiler
    ? `<details class="spoiler"><summary>Spoiler-full deep dive<span class="warn">Contains spoilers. Click only if you've read it.</span></summary><div class="body">${md(
        spoiler
      )}</div></details>`
    : "";

  const body = fill(T_WORK, {
    ROOT: root,
    TITLE_EN: escapeHtml(d.title_en || e.slug),
    TITLE_JA: escapeHtml(d.title_ja || ""),
    TAGS: tagsHtml,
    HOOK: escapeHtml(d.hook || ""),
    REVIEW: md(review),
    IF_YOU_LIKED: ifLiked,
    RENTA_URL: escapeHtml(d.renta_url || "#"),
    SPOILER: spoilerHtml,
  });

  return page({
    pageTitle: `${d.title_en} (${d.title_ja}) ${DASH} ${cfg.SITE_NAME}`,
    meta: d.one_line_meta || d.hook || "",
    canonical: `${cfg.SITE_URL}/works/${e.slug}.html`,
    ogType: "article",
    root,
    bodyHtml: body,
  });
}

function workListItem(e, root) {
  const d = e.data;
  const tags = (d.genre_tags || []).join(" / ");
  return `<li><a href="${root}works/${e.slug}.html">
    <span class="wl-title">${escapeHtml(d.title_en)}</span><span class="wl-ja">${escapeHtml(
    d.title_ja || ""
  )}</span>
    <div class="wl-hook">${escapeHtml(d.hook || "")}</div>
    <div class="wl-tags">${escapeHtml(tags)}</div>
  </a></li>`;
}

function renderIndex(entries) {
  const root = rootPrefix(0);
  const featured =
    entries.find((e) => e.data.featured === true) || entries[0];
  const list = entries.map((e) => workListItem(e, root)).join("\n");
  const body = fill(T_INDEX, {
    FEAT_URL: `${root}works/${featured.slug}.html`,
    FEAT_TITLE_EN: escapeHtml(featured.data.title_en),
    FEAT_TITLE_JA: escapeHtml(featured.data.title_ja || ""),
    FEAT_HOOK: escapeHtml(featured.data.hook || ""),
    WORK_LIST: list,
  });
  return page({
    pageTitle: `${cfg.SITE_NAME} ${DASH} dark, psychological Japanese manga, curated`,
    meta: "A one-person curation of dark, psychological, introspective Japanese manga for English readers. I won't lead you wrong.",
    canonical: cfg.SITE_URL,
    ogType: "website",
    root,
    bodyHtml: body,
  });
}

function renderTagPages(entries) {
  const map = new Map();
  const add = (name) => {
    const s = slugify(name);
    if (!map.has(s)) map.set(s, { name, entries: [] });
    return s;
  };
  cfg.MOOD_DOORS.forEach(add);
  for (const e of entries) {
    for (const t of e.data.genre_tags || []) {
      const s = add(t);
      map.get(s).entries.push(e);
    }
  }
  const root = rootPrefix(1);
  for (const [slug, { name, entries: es }] of map) {
    const list = es.length
      ? es.map((e) => workListItem(e, root)).join("\n")
      : `<li><a href="${root}index.html"><span class="wl-title" style="color:var(--ink-faint)">Nothing here yet &mdash; back to all works</span></a></li>`;
    const body = fill(T_TAG, {
      ROOT: root,
      TAG_NAME: escapeHtml(name),
      WORK_LIST: list,
    });
    const html = page({
      pageTitle: `${name} manga ${DASH} ${cfg.SITE_NAME}`,
      meta: `Dark, psychological Japanese manga for the mood: ${name}.`,
      canonical: `${cfg.SITE_URL}/tag/${slug}.html`,
      root,
      bodyHtml: body,
    });
    write(path.join("tag", `${slug}.html`), html);
  }
  return map.size;
}

// Static pages (About / Privacy / Contact / etc.) live in content/pages/*.md.
const PAGES_DIR = path.join(ROOT, "content", "pages");
function loadPages() {
  if (!fs.existsSync(PAGES_DIR)) return [];
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md")
    .map((f) => {
      const parsed = matter(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"));
      return {
        slug: f.replace(/\.md$/, ""),
        data: parsed.data || {},
        body: parsed.content || "",
      };
    });
}

function renderStaticPages() {
  const root = rootPrefix(0);
  const pages = loadPages();
  for (const pg of pages) {
    const title = pg.data.title || pg.slug;
    const body = `<article class="static-page">
  <p><a class="back" href="${root}index.html">&larr; All works</a></p>
  <h1 class="work-head">${escapeHtml(title)}</h1>
  <div class="review">${md(pg.body)}</div>
</article>`;
    const html = page({
      pageTitle: `${title} ${DASH} ${cfg.SITE_NAME}`,
      meta: pg.data.meta || "",
      canonical: `${cfg.SITE_URL}/${pg.slug}.html`,
      root,
      bodyHtml: body,
    });
    write(`${pg.slug}.html`, html);
  }
  return pages.length;
}

function copyAssets() {
  const src = path.join(ROOT, "assets");
  const dst = path.join(DIST, "assets");
  ensureDir(dst);
  for (const f of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
  }
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  const published = loadEntries()
    .filter((e) => e.data.status === "published")
    .sort((a, b) => (b.data.generated_at || "").localeCompare(a.data.generated_at || ""));

  if (published.length === 0) {
    console.warn("No published entries. Building empty shell.");
  }

  for (const e of published) {
    write(path.join("works", `${e.slug}.html`), renderWorkPage(e));
  }
  write("index.html", renderIndex(published.length ? published : [{ slug: "none", data: { title_en: "Coming soon", title_ja: "", hook: "" } }]));
  const tagCount = renderTagPages(published);
  const pageCount = renderStaticPages();
  copyAssets();

  fs.writeFileSync(path.join(DIST, ".nojekyll"), "");

  console.log(
    `Built ${published.length} work page(s), ${tagCount} tag page(s), ${pageCount} static page(s) -> dist/`
  );
}

main();
