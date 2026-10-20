const assert = require("node:assert/strict");
const { chunkText, cleanExtractedText } = require("../utils/chunkText");

function run() {
  // Empty input produces no chunks.
  assert.deepEqual(chunkText(""), []);
  assert.deepEqual(chunkText("   \n\n  "), []);

  // Short text fits in a single chunk.
  const short = "The quick brown fox jumps over the lazy dog.";
  const shortChunks = chunkText(short, { chunkSize: 1800, overlap: 250 });
  assert.equal(shortChunks.length, 1);
  assert.equal(shortChunks[0], short);

  // Long text splits into multiple chunks, none exceeding chunkSize by more
  // than one word's worth of slack (the algorithm only checks size before
  // adding the *next* word, so a chunk itself never exceeds chunkSize).
  const longText = Array.from(
    { length: 2000 },
    (_, i) => `word${i}`
  ).join(" ");
  const chunks = chunkText(longText, { chunkSize: 500, overlap: 100 });
  assert.ok(chunks.length > 1, "long text should split into multiple chunks");
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 500, `chunk exceeded chunkSize: ${chunk.length}`);
  }

  // No word is ever split in half: every chunk is composed of whole
  // "wordN" tokens only.
  for (const chunk of chunks) {
    for (const token of chunk.split(" ")) {
      assert.match(token, /^word\d+$/, `found a malformed/split token: "${token}"`);
    }
  }

  // Consecutive chunks overlap: the end of chunk[i] and the start of
  // chunk[i+1] share at least one word from the overlap window (~100
  // chars ~ ~15 short words here, so check a window wide enough to catch
  // it rather than just the very last/first word).
  for (let i = 0; i < chunks.length - 1; i++) {
    const endWords = chunks[i].split(" ").slice(-20);
    const startWords = chunks[i + 1].split(" ").slice(0, 20);
    const sharesWord = endWords.some((w) => startWords.includes(w));
    assert.ok(sharesWord, `chunks ${i} and ${i + 1} should overlap`);
  }

  // A single word far longer than chunkSize doesn't crash or infinite-loop.
  const hugeWord = "x".repeat(3000);
  const hugeChunks = chunkText(`${hugeWord} short`, { chunkSize: 500, overlap: 100 });
  assert.ok(hugeChunks.length >= 1);

  // cleanExtractedText strips control characters and collapses whitespace.
  assert.equal(
    cleanExtractedText("Hello\u0000World\n\n\n  there"),
    "Hello World there"
  );
  assert.equal(cleanExtractedText(""), "");
  assert.equal(cleanExtractedText(null), "");

  console.log("chunkText.test.js: all assertions passed");
}

run();
