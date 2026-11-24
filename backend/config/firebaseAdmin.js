const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const os = require("os");

const projectId =
  process.env.FIREBASE_PROJECT_ID || "ai-study-assistant-75ffb";

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (jsonFromEnv) {
    let serviceAccount;

    try {
      serviceAccount = JSON.parse(jsonFromEnv);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON"
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });

    return admin;
  }

const localKeyPath = path.join(
  os.homedir(),
  ".smartpal",
  "firebase-service-account.json"
);

  if (fs.existsSync(localKeyPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(localKeyPath, "utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });

    return admin;
  }

  throw new Error(
    "Firebase Admin credentials are not configured. " +
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or provide the private local key."
  );
}

module.exports = { initializeFirebaseAdmin };