
const assert = require("node:assert/strict");
const Module = require("node:module");

const firebaseAdminPath = require.resolve("../config/firebaseAdmin");
const originalLoad = Module._load;

let tokenBehavior = "valid";

Module._load = function (request, parent, isMain) {
  if (
    request === "../config/firebaseAdmin" &&
    parent &&
    parent.filename === require.resolve("../middleware/requireAuth")
  ) {
    return {
      initializeFirebaseAdmin() {
        return {
          auth() {
            return {
              async verifyIdToken(token) {
                assert.equal(token, "test-token");

                if (tokenBehavior === "invalid") {
                  const error = new Error("Invalid token");
                  error.code = "auth/invalid-id-token";
                  throw error;
                }

                return {
                  uid: "test-user-123",
                  email: "student@example.com",
                };
              },
            };
          },
        };
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const requireAuth = require("../middleware/requireAuth");

// Restore Node's module loader immediately after loading the middleware.
Module._load = originalLoad;

async function run() {
  // Missing token is rejected.
  let statusCode;
  let responseBody;
  let nextCalled = false;

  await requireAuth(
    { headers: {} },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    },
    () => {
      nextCalled = true;
    }
  );

  assert.equal(statusCode, 401);
  assert.equal(responseBody.error, "Authentication required");
  assert.equal(nextCalled, false);

  // Valid token authenticates the user.
  let authenticatedUser;
  nextCalled = false;

  await requireAuth(
    { headers: { authorization: "Bearer test-token" } },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    },
    function next() {
      nextCalled = true;
      authenticatedUser = this;
    }.bind({})
  );

  // The middleware sets req.user before calling next().
  // Use a separate request object to assert that directly.
  const validRequest = {
    headers: { authorization: "Bearer test-token" },
  };
  nextCalled = false;

  await requireAuth(
    validRequest,
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    },
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.deepEqual(validRequest.user, {
    uid: "test-user-123",
    email: "student@example.com",
  });

  // Invalid token is rejected.
  tokenBehavior = "invalid";
  statusCode = undefined;
  responseBody = undefined;
  nextCalled = false;

  await requireAuth(
    { headers: { authorization: "Bearer test-token" } },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    },
    () => {
      nextCalled = true;
    }
  );

  assert.equal(statusCode, 401);
  assert.equal(
    responseBody.error,
    "Invalid or expired authentication token"
  );
  assert.equal(nextCalled, false);

  console.log(
    "requireAuth.test.js: missing, valid, and invalid token cases passed"
  );
}

module.exports = run().finally(() => {
  Module._load = originalLoad;
});