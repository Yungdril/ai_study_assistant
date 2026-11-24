const { initializeFirebaseAdmin } = require("../config/firebaseAdmin");

async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  try {
    const admin = initializeFirebaseAdmin();

    const decodedToken = await admin
      .auth()
      .verifyIdToken(match[1]);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };

    return next();
  } catch (error) {
    console.error("Authentication verification failed:", {
      code: error.code || "unknown",
    });

    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
}

module.exports = requireAuth;