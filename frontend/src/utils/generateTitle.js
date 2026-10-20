const MAX_TITLE_LENGTH = 45;

// Common leading phrasings that carry no topical information on their own
// ("Explain X", "Can you tell me about X" -> just "X"). Applied repeatedly
// since these can stack ("Please can you explain ..."). Purely rule-based —
// no AI call — per Phase 1 scope.
const LEADING_FILLER_PATTERNS = [
  /^please\s+/i,
  /^(can|could|would)\s+you\s+(please\s+)?/i,
  /^explain\s+/i,
  /^describe\s+/i,
  /^define\s+/i,
  /^tell\s+me\s+about\s+/i,
  /^help\s+me\s+(with|understand)\s+/i,
  /^what\s+(is|are)\s+/i,
  /^how\s+(do|does|can)\s+(i|you)\s+/i,
];

const LEADING_ARTICLE_PATTERN = /^(the|a|an)\s+/i;
const TRAILING_FILLER_PATTERN = /\s+(to me|for me|please)[.?!]*$/i;
const TRAILING_PUNCTUATION_PATTERN = /[.?!]+$/;

/**
 * Derives a short conversation title from the first user message.
 * Strips common question/instruction framing ("Explain ", "What is ",
 * "Can you tell me about ", a leading article, trailing "to me"/"please",
 * and trailing punctuation) so simple prompts collapse to a topic-style
 * title, then falls back to word-boundary truncation for longer text.
 * Deliberately not an AI call, to avoid extra latency/cost for Phase 1.
 */
export function generateTitleFromMessage(text) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "New Conversation";

  let working = cleaned;
  let changedThisPass = true;
  while (changedThisPass) {
    changedThisPass = false;
    for (const pattern of LEADING_FILLER_PATTERNS) {
      if (pattern.test(working)) {
        working = working.replace(pattern, "");
        changedThisPass = true;
      }
    }
  }
  working = working.replace(LEADING_ARTICLE_PATTERN, "");
  working = working.replace(TRAILING_FILLER_PATTERN, "");
  working = working.replace(TRAILING_PUNCTUATION_PATTERN, "");
  working = working.trim();

  // If stripping left nothing meaningful (e.g. the whole message WAS just
  // filler words), fall back to the original cleaned text.
  const base = working.length > 0 ? working : cleaned;
  const titleCased = base.charAt(0).toUpperCase() + base.slice(1);

  if (titleCased.length <= MAX_TITLE_LENGTH) return titleCased;

  const truncated = titleCased.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  const truncatedBase = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated;
  return `${truncatedBase}…`;
}
