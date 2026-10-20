const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const chatRoutes = require("./routes/chat.routes");
const quizRoutes = require("./routes/quiz.routes");
const pdfRoutes = require("./routes/pdf.routes");
const plannerRoutes = require("./routes/planner.routes");
const documentsRoutes = require("./routes/documents.routes");
const errorHandler = require("./middleware/errorHandler");
const startKeepAlive = require("./services/keepAlive");
const documentStore = require("./services/documentStore");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AI Study Assistant API Running",
  });
});

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
