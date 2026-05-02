const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const nominationController = require("../controllers/nominationController");

// =========================
// DEBUG CHECK (IMPORTANT)
// =========================
console.log("CONTROLLER LOADED:", nominationController);

// =========================
// USER ROUTES
// =========================
router.post("/", authMiddleware, nominationController.submitNomination);

router.get("/me", authMiddleware, nominationController.getMyNominations);

// =========================
// ADMIN ROUTE
// =========================
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  nominationController.getAllNominations
);

module.exports = router;