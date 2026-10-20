const assert = require("node:assert/strict");
const { retrieveRelevantChunks } = require("../utils/retrieveChunks");

function run() {
  const chunks = [
    "Photosynthesis is the process plants use to convert light into energy.",
    "The mitochondria is the powerhouse of the cell, producing ATP.",
    "A surcharge is applied above 40 units to discourage excess usage.",
    "Binary trees are a data structure where each node has at most two children.",
    "The French Revolution began in 1789 and reshaped European politics.",
  ];

  // Empty chunk list returns nothing, never throws.
  assert.deepEqual(retrieveRelevantChunks([], "anything"), []);

  // A question closely matching one chunk ranks that chunk first.
  const surchargeResults = retrieveRelevantChunks(
    chunks,
    "Why is the surcharge applied above 40 units?",
    { topN: 3 }
  );
  assert.ok(surchargeResults.length > 0);
  assert.equal(surchargeResults[0].chunkIndex, 2);

  // Binary trees question ranks the binary trees chunk first.
  const treeResults = retrieveRelevantChunks(chunks, "Explain binary trees", {
    topN: 3,
  });
  assert.equal(treeResults[0].chunkIndex, 3);

  // topN is respected.
  const limited = retrieveRelevantChunks(chunks, "the", { topN: 2 });
  assert.equal(limited.length, 2);

  // A question with zero term overlap still returns topN chunks (stable
  // fallback to original order) rather than an empty array — the model
  // still gets *some* context and can say it's insufficient.
  const noOverlap = retrieveRelevantChunks(chunks, "xyzxyz qqqqq zzzzz", {
    topN: 3,
  });
  assert.equal(noOverlap.length, 3);
  assert.deepEqual(
    noOverlap.map((c) => c.chunkIndex),
    [0, 1, 2]
  );

  // Results include score and are sorted descending.
  for (let i = 0; i < surchargeResults.length - 1; i++) {
    assert.ok(surchargeResults[i].score >= surchargeResults[i + 1].score);
  }

  console.log("retrieveChunks.test.js: all assertions passed");
}

run();
