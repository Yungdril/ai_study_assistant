const http = require("http");
const https = require("https");
const env = require("../config/env");

// Prevent Render free tier from sleeping.
// Uses HTTP locally and HTTPS when deployed.
function startKeepAlive() {
  if (!env.SELF_URL) {
    return;
  }

  const client = env.SELF_URL.startsWith("https://") ? https : http;

  setInterval(() => {
    client
      .get(env.SELF_URL, (res) => {
        console.log("Keep-alive ping:", res.statusCode);
      })
      .on("error", (err) => {
        console.log("Ping error:", err.message);
      });
  }, 14 * 60 * 1000); // ping every 14 minutes
}

module.exports = startKeepAlive;