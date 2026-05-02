require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
const path = require("path");


/* =========================
   SECURITY HEADERS
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* =========================
   CORS (LOCK THIS IN PRODUCTION)
========================= */
/* =========================
   CORS (PRODUCTION SAFE FIX)
========================= */

const allowedOrigins = [
  "https://awardskusa.netlify.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow mobile apps or curl (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// 🔥 HANDLE PRE-FLIGHT REQUESTS
app.options("*", cors());

/* =========================
   BODY PARSING
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   GLOBAL RATE LIMITER
   (protect whole API)
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
   STRICT VOTE LIMITER
   (extra protection layer)
========================= */
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: "You are voting too fast. Slow down.",
  },
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/vote", voteLimiter, voteRoutes); // 🔥 extra protection
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
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);

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
