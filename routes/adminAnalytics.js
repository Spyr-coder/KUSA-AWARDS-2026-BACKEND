const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getDashboardStats,
  getVotesPerCategory,
  getTopNominees,
} = require("../controllers/adminAnalyticsController");

/* =========================
   DASHBOARD OVERVIEW
========================= */
router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);

/* =========================
   VOTES PER CATEGORY
========================= */
router.get(
  "/votes-per-category",
  authMiddleware,
  adminMiddleware,
  getVotesPerCategory
);

/* =========================
   TOP NOMINEES
========================= */
router.get(
  "/top-nominees",
  authMiddleware,
  adminMiddleware,
  getTopNominees
);

module.exports = router;