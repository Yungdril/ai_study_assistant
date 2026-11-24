
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const env = require("./config/env");
const chatRoutes = require("./routes/chat.routes");
const quizRoutes = require("./routes/quiz.routes");
const pdfRoutes = require("./routes/pdf.routes");
const plannerRoutes = require("./routes/planner.routes");
const documentsRoutes = require("./routes/documents.routes");
const errorHandler = require("./middleware/errorHandler");
const startKeepAlive = require("./services/keepAlive");
const documentStore = require("./services/documentStore");
const requireAuth = require("./middleware/requireAuth");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
    : []),
].filter(Boolean);

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as local health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

app.use(apiLimiter);

app.get("/", (req, res) => {
  res.json({
    message: "AI Study Assistant API Running",
  });
});

// Every feature endpoint requires a valid Firebase ID token.
app.use(requireAuth);

app.use(chatRoutes);
app.use(quizRoutes);
app.use(pdfRoutes);
app.use(plannerRoutes);
app.use(documentsRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

startKeepAlive();
documentStore.startCleanupTimer();
