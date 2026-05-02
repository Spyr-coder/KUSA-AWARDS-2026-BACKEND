const express = require("express");
const router = express.Router();

const {
  getResults,
  getWinner,
  getPublishedWinners,
} = require("../controllers/resultsController");

const authMiddleware = require("../middleware/authMiddleware");

/* =========================
   PUBLIC WINNERS (MUST COME FIRST)
========================= */
router.get("/published", getPublishedWinners);
router.get("/public/winners", getPublishedWinners);

/* =========================
   CATEGORY RESULTS (ADMIN)
========================= */
router.get("/:categoryId", authMiddleware, getResults);

/* =========================
   CATEGORY WINNER
========================= */
router.get("/:categoryId/winner", authMiddleware, getWinner);

module.exports = router;