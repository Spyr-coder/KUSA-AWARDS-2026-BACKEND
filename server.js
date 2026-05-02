require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const voteRoutes = require("./routes/vote");
const categoryRoutes = require("./routes/category");
const nomineeRoutes = require("./routes/nominee");
const settingsRoutes = require("./routes/settings");
const resultsRoutes = require("./routes/results");
const adminRoutes = require("./routes/admin");
const nominationRoutes = require("./routes/nominations");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");
const adminAuthRoutes = require("./routes/adminAuth");

const app = express();

/* =========================
   SECURITY HEADERS
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* =========================
   CORS CONFIG
========================= */

const allowedOrigins = [
  "https://awardskusa.netlify.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman/server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS Origin:", origin);

    // Do NOT crash the server
    return callback(null, false);
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

/* =========================
   PREFLIGHT FIX
========================= */
/*
  IMPORTANT:
  Express/path-to-regexp in newer versions
  crashes on "*" and "/*"

  Use REGEX instead
*/
app.options(/.*/, cors(corsOptions));

/* =========================
   BODY PARSING
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   GLOBAL RATE LIMITER
========================= */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: "Too many requests. Try again later.",
  },
});

app.use("/api", apiLimiter);

/* =========================
   VOTE LIMITER
========================= */
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: "You are voting too fast. Slow down.",
  },
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/vote", voteLimiter, voteRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/nominees", nomineeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/nominations", nominationRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin-auth", adminAuthRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("KUSA Awards 2026 API Running 🚀");
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
