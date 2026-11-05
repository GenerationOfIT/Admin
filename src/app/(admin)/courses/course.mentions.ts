/**
 * Places where the public site writes a course's name as fixed text, so they
 * don't follow a rename made here. Keyed by the saved slug. Keep in sync with
 * the GenOfIT site's src/content/about.ts, academy.ts and qa-bridge.ts.
 */
export const fixedTitleMentions: Record<string, readonly string[]> = {
  "manual-testing": [
    "About page course list",
    "Academy page “New to IT?” recommendation",
    "QA Bridge requirements (“completed the QA Manual Pro course”)",
  ],
  "automated-testing": [
    "About page course list",
    "Academy page recommendation (“Automated or API Testing”)",
  ],
  "api-testing": [
    "About page course list",
    "Academy page recommendation (“Automated or API Testing”)",
  ],
  "sql-testing": ["About page course list", "Academy page recommendation"],
  "career-program": ["About page course list", "Academy page recommendation"],
  "mobile-testing": ["About page course list"],
};
