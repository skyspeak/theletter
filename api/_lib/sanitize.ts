// Deterministic banned-phrase safety net for generated issues.
//
// The system prompt bans a list of LinkedIn-cringe phrases ("leverage",
// "unlock", "the power of", ...). The prompt removes the vast majority, but an
// LLM at temperature 0.4 occasionally slips one through — and each slip is a
// different grammatical form (verb "unlock the value", noun "the real value
// unlock"), so prompt instructions alone can't guarantee zero. Because the ban
// is zero-tolerance AND deterministic, we guarantee it deterministically here:
// scan every reader-facing string and rewrite any banned phrase to a plain
// equivalent. This is a backstop — the prompt does the real work, so this
// rarely fires; when it does, an occasionally-plain rewrite beats shipping the
// cringe word.
//
// Keep the phrases covered here a superset of scripts/eval/rules.ts
// BANNED_PHRASES, so a sanitized payload always clears the content-eval gate.

import type { IssuePayload, CuratedArticle } from "./prompts.js";

// Order matters: more specific phrases first (so "harness the power of" wins
// over "the power of", "game-changing" over "game-changer"). Each replacement
// is plain English and contains no banned substring itself.
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bharness the power of\b/gi, "use"],
  [/\bunlocks\b/gi, "opens up"],
  [/\bunlocking\b/gi, "opening up"],
  [/\bunlock\b/gi, "open up"],
  [/\bleverages\b/gi, "uses"],
  [/\bleveraging\b/gi, "using"],
  [/\bleverage\b/gi, "use"],
  [/\bsupercharges\b/gi, "boosts"],
  [/\bsupercharging\b/gi, "boosting"],
  [/\bsupercharge\b/gi, "boost"],
  [/\bgame-?changing\b/gi, "major"],
  [/\bgame-?changers?\b/gi, "big deal"],
  [/\brevolutionizing\b/gi, "transforming"],
  [/\brevolutionizes\b/gi, "transforms"],
  [/\brevolutionize\b/gi, "transform"],
  [/\bcutting-edge\b/gi, "advanced"],
  [/\belevate your\b/gi, "improve your"],
  [/\bto the next level\b/gi, "further"],
  [/\bin today's fast-paced\b/gi, "in"],
  [/\bin the rapidly evolving\b/gi, "in"],
  [/\bin your role as\b/gi, "as"],
  [/\bthe power of\b/gi, ""], // last "power" handler
];

function matchesCapitalized(m: string): boolean {
  return m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase();
}

function cleanString(s: string): string {
  let out = s;
  for (const [re, rep] of REPLACEMENTS) {
    out = out.replace(re, (m) => {
      if (!rep) return "";
      return matchesCapitalized(m) ? rep[0].toUpperCase() + rep.slice(1) : rep;
    });
  }
  // Tidy artifacts left by deletions (e.g. "the power of " -> "").
  return out
    .replace(/ {2,}/g, " ")
    .replace(/ ([,.;:!?])/g, "$1")
    .trim();
}

// Build commands/prompts must be copy-paste-safe: straight quotes (curly ones
// break paste into a terminal) and ASCII hyphens (en/em dashes break CLI flag
// parsing). Deterministic, like the banned-phrase strip — guarantees the
// build.curlyQuotes / build.cliDashes rules can never fire on shipped content.
function toAscii(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*[–—]\s*/g, " - ");
}

function cleanArticle(a: CuratedArticle): CuratedArticle {
  return {
    ...a,
    title: cleanString(a.title),
    whyRelevant: cleanString(a.whyRelevant),
    summary: (a.summary ?? []).map(cleanString),
    takeaway: cleanString(a.takeaway),
    // sourceUrl / publishedDate are not reader prose — leave untouched.
  };
}

// Returns which banned phrases are present (lowercased substrings), for logging.
export function findBannedPhrases(p: IssuePayload): string[] {
  const text = JSON.stringify(p).toLowerCase();
  const phrases = [
    "leverage", "unlock", "supercharge", "in today's fast-paced",
    "in the rapidly evolving", "harness the power of", "game-changer",
    "game-changing", "revolutionize", "revolutionizing", "cutting-edge",
    "the power of", "elevate your", "to the next level", "in your role as",
  ];
  return phrases.filter((ph) => text.includes(ph));
}

// Banned-phrase strip + ASCII for code (build) text.
const buildText = (s: string): string => toAscii(cleanString(s));

// Pure: returns a new payload with reader-facing strings sanitized — banned
// phrases removed everywhere, and build commands/prompts forced to copy-paste-
// safe ASCII. Run by both the prod pipeline (issue_gen.ts) and the eval, so the
// eval grades exactly what ships.
export function sanitizeIssue(p: IssuePayload): IssuePayload {
  const b = p.buildExercise;
  return {
    ...p,
    newsletterPicks: (p.newsletterPicks ?? []).map(cleanArticle),
    news: cleanArticle(p.news),
    forYourRole: (p.forYourRole ?? []).map(cleanArticle),
    buildExercise: b
      ? {
          ...b,
          title: buildText(b.title),
          pitch: buildText(b.pitch),
          timeEstimate: buildText(b.timeEstimate),
          whyPicked: buildText(b.whyPicked),
          tools: (b.tools ?? []).map(buildText),
          resources: (b.resources ?? []).map(toAscii),
          steps: (b.steps ?? []).map((s) => ({
            step: buildText(s.step),
            detail: buildText(s.detail),
          })),
        }
      : b,
    quiz: {
      ...p.quiz,
      questions: (p.quiz?.questions ?? []).map((q) => ({
        ...q,
        question: cleanString(q.question),
        options: (q.options ?? []).map(cleanString),
        explanation: cleanString(q.explanation),
      })),
    },
  };
}
