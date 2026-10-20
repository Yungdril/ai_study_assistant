// No test framework is set up in this project (no jest/mocha in
// package.json), so these are plain Node scripts using the built-in
// `assert` module — each one throws and exits non-zero on first failure.
// Run with: node tests/runAll.js  (or `npm test` from backend/).
//
// Most test files run their assertions synchronously at require()-time. A
// test that needs to do real async work (e.g. documentsExplainRoute.test.js,
// which starts an in-process HTTP server) instead exports the in-flight
// promise from `require(test)`, so it's awaited here before we report
// overall pass/fail — otherwise a late async failure could be reported
// after "All backend tests passed." already printed.
const tests = [
  "./chunkText.test.js",
  "./retrieveChunks.test.js",
  "./documentStore.test.js",
  "./buildExplainPrompt.test.js",
  "./documentsExplainRoute.test.js",
  "./buildStudyChatPrompt.test.js",
  "./documentStudyChatRoute.test.js",
];

async function main() {
  let failed = false;
  for (const test of tests) {
    try {
      const result = require(test);
      if (result && typeof result.then === "function") {
        await result;
      }
    } catch (error) {
      failed = true;
      console.error(`FAILED: ${test}`);
      console.error(error);
    }
  }

  if (failed) {
    console.error("\nSome tests failed.");
    process.exit(1);
  } else {
    console.log("\nAll backend tests passed.");
  }
}

main();
