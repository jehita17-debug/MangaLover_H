// Site-wide config. Edit SITE_URL when the domain is decided.
module.exports = {
  SITE_NAME: "MangaLover_H",
  // Used for canonical URLs / og tags. No trailing slash. Update when domain is live.
  SITE_URL: "https://example.com",

  // Top-nav "mood doors" (設計書 §4). English search terms, on purpose.
  // These always get a tag page, even before a matching work exists.
  MOOD_DOORS: [
    "Psychological",
    "Slow-burn dread",
    "Morally grey",
    "Dark fantasy",
    "Crime / Mystery",
    "Quiet seinen",
  ],

  // The model used for review generation. Claude API.
  GEN_MODEL: "claude-sonnet-4-6",
  GEN_MAX_TOKENS: 2400,
};
