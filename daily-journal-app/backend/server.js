require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const entriesRouter = require("./routes/entries");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({
  // This app has no external scripts; allowing inline styles is unnecessary.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
    }
  }
}));
app.use(express.json({ limit: "40kb" }));
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a little and try again." }
}));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "daily-journal-api" }));
app.use("/api/entries", entriesRouter);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.use((error, req, res, next) => {
  // Log details on the server for debugging; do not return raw DB errors to the browser.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, error.message || error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "The server could not complete that request. Check the server terminal and Supabase configuration." });
});

app.listen(PORT, () => {
  console.log(`Daily Journal App running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
