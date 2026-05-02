const express = require("express");
const router = express.Router();

const { toggleVoting } = require("../controllers/settingsController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.patch("/voting", authMiddleware, adminMiddleware, toggleVoting);

module.exports = router;