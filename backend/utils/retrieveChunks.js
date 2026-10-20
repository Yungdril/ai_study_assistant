// Small curated stop-word list — enough to filter out noise words that
// would otherwise dominate term-overlap scoring, without pulling in a
// dependency for something this simple.
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "of", "in", "on", "at", "to", "for", "and", "or", "but", "nor", "as",
  "by", "with", "about", "against", "between", "into", "through", "during",
  "before", "after", "above", "below", "from", "up", "down", "out", "off",
  "over", "under", "again", "further", "then", "once", "that", "this",
  "these", "those", "it", "its", "do", "does", "did", "doing", "what",
  "which", "who", "whom", "how", "why", "when", "where", "can", "could",
  "should", "would", "will", "shall", "may", "might", "must", "i", "you",
  "he", "she", "we", "they", "them", "his", "her", "their", "our", "your",
  "my", "me", "him", "so", "if", "not", "no", "yes", "there", "here",
]);

function normalizeToTokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function meaningfulTerms(tokens) {
  return tokens.filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Lightweight lexical retrieval — no embeddings, no external services.
 * Scores each chunk by how many distinct question terms it contains
 * (weighted higher, to reward broad coverage of the question) plus total
 * term occurrences, with a bonus if the question appears as a verbatim
 * phrase. Deterministic: identical input always produces the same ranking,
 * and ties fall back to original chunk order (Array#sort is stable), so a
 * question with no term overlap at all still returns the first `topN`
 * chunks rather than nothing — giving the model *some* grounded context to
 * reason over (the Q&A prompt instructs it to say so if that's not enough).
 *
 * @param {string[]} chunks - chunk texts in document order.
 * @param {string} question
 * @param {{topN?: number}} [options]
 * @returns {{chunkIndex: number, text: string, score: number}[]}
 */
function retrieveRelevantChunks(chunks, question, options = {}) {
  const topN = options.topN ?? 4;
  if (!Array.isArray(chunks) || chunks.length === 0) return [];

  const questionTokens = normalizeToTokens(question);
  const queryTerms = [...new Set(meaningfulTerms(questionTokens))];
  const normalizedQuestionPhrase = questionTokens.join(" ");
  const usePhraseBonus = questionTokens.length >= 2;

  const scored = chunks.map((text, chunkIndex) => {
    const chunkTokens = normalizeToTokens(text);
    const chunkTermCounts = new Map();
    for (const token of chunkTokens) {
      chunkTermCounts.set(token, (chunkTermCounts.get(token) || 0) + 1);
    }

    let distinctMatches = 0;
    let totalOccurrences = 0;
    for (const term of queryTerms) {
      const count = chunkTermCounts.get(term) || 0;
      if (count > 0) {
        distinctMatches += 1;
        totalOccurrences += count;
      }
    }

    let score = distinctMatches * 2 + totalOccurrences;

    if (usePhraseBonus && normalizedQuestionPhrase) {
      const normalizedChunk = chunkTokens.join(" ");
      if (normalizedChunk.includes(normalizedQuestionPhrase)) {
        score += 5;
      }
    }

    return { chunkIndex, text, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

module.exports = { retrieveRelevantChunks };
