const DEFAULT_CHUNK_SIZE = 1800;
const DEFAULT_OVERLAP = 250;

/**
 * Splits cleaned document text into overlapping chunks for lexical
 * retrieval. Deterministic and dependency-free: builds each chunk by
 * appending whole words until the next word would exceed chunkSize, then
 * seeds the next chunk with the tail of the previous one (snapped to a
 * word boundary) so chunks overlap by roughly `overlap` characters without
 * ever splitting a word mid-way.
 *
 * @param {string} text - already-cleaned text (see cleanExtractedText).
 * @param {{chunkSize?: number, overlap?: number}} [options]
 * @returns {string[]} chunk texts, in document order. Empty input -> [].
 */
function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return [];

  const words = normalized.split(" ");
  const chunks = [];
  let current = "";

  const takeOverlapSeed = (finishedChunk) => {
    if (overlap <= 0 || finishedChunk.length <= overlap) return "";
    const tail = finishedChunk.slice(-overlap);
    const firstSpace = tail.indexOf(" ");
    // Snap to a word boundary so we never resume mid-word; if there's no
    // space in the tail window (one very long "word"), skip the overlap
    // rather than grabbing a partial word.
    return firstSpace === -1 ? "" : tail.slice(firstSpace + 1);
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length > chunkSize && current) {
      chunks.push(current);
      const seed = takeOverlapSeed(current);
      current = seed ? `${seed} ${word}` : word;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

/**
 * Basic cleanup of raw pdf-parse output before chunking: strips null bytes
 * and other control characters PDF extraction sometimes leaves behind, and
 * collapses excess whitespace. Kept separate from chunkText so callers can
 * reuse either piece independently (e.g. tests chunk already-clean text).
 */
function cleanExtractedText(rawText) {
  if (!rawText) return "";
  return rawText
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { chunkText, cleanExtractedText, DEFAULT_CHUNK_SIZE, DEFAULT_OVERLAP };
