// generate.js — fills in review/tags/hook/comparison for draft entries via Claude API.
// Only touches entries with status "draft" or "regenerate". Skips "published"
// (saves cost + keeps generation idempotent). Run by GitHub Actions before build.
//
//   ANTHROPIC_API_KEY=sk-... node scripts/generate.js
//
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const cfg = require("./config");
const { ROOT, loadEntries, joinBody, writeEntry } = require("./lib");

const PROMPT_FILE = path.join(ROOT, "prompts", "review-prompt.md");

// Pull the SYSTEM PROMPT block + USER MESSAGE TEMPLATE out of the prompt file,
// so the prose around them in the .md is documentation only.
function loadPrompt() {
  const txt = fs.readFileSync(PROMPT_FILE, "utf8");
  const sys = txt.split("## SYSTEM PROMPT")[1]?.split("## USER MESSAGE TEMPLATE")[0] || "";
  const usr = txt.split("## USER MESSAGE TEMPLATE")[1] || "";
  // strip the ``` fences and the "(paste this whole block...)" lines
  const clean = (s) =>
    s.replace(/```[a-z]*\n?/gi, "").replace(/^\s*\(.*paste.*\)\s*$/gim, "").trim();
  return { system: clean(sys), userTemplate: clean(usr) };
}

function fillTemplate(tpl, data) {
  return tpl
    .replace(/\{\{title_en\}\}/g, data.title_en || "")
    .replace(/\{\{title_ja\}\}/g, data.title_ja || "")
    .replace(/\{\{mood_note\}\}/g, data.mood_note || "")
    .replace(/\{\{notes\}\}/g, data.notes || "");
}

// Pull the first JSON object out of the model's reply, robust to stray prose.
function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  return JSON.parse(text.slice(start, end + 1));
}

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey: key });
  const { system, userTemplate } = loadPrompt();

  const todo = loadEntries().filter(
    (e) => e.data.status === "draft" || e.data.status === "regenerate"
  );

  if (todo.length === 0) {
    console.log("Nothing to generate. (no draft/regenerate entries)");
    return;
  }
  console.log(`Generating ${todo.length} entr${todo.length === 1 ? "y" : "ies"}...`);

  for (const entry of todo) {
    const d = entry.data;
    if (!d.title_en || !d.mood_note) {
      console.warn(`  ! ${entry.slug}: missing title_en or mood_note — skipped`);
      continue;
    }
    process.stdout.write(`  - ${entry.slug} ... `);

    const msg = await client.messages.create({
      model: cfg.GEN_MODEL,
      max_tokens: cfg.GEN_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: fillTemplate(userTemplate, d) }],
    });

    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    let out;
    try {
      out = parseJson(text);
    } catch (e) {
      console.log("FAILED to parse JSON — left as draft");
      console.error(text);
      continue;
    }

    const newData = {
      ...d,
      status: "published",
      genre_tags: Array.isArray(out.genre_tags) ? out.genre_tags : [],
      hook: out.hook || "",
      if_you_liked: out.if_you_liked || "",
      one_line_meta: out.one_line_meta || "",
      generated_at: new Date().toISOString().slice(0, 10),
    };
    const newBody = joinBody(out.review || "", out.spoiler_deep_dive || "");
    writeEntry(entry, newData, newBody);
    console.log("done");
  }
  console.log("Generation complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
