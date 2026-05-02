const express = require("express");
const router = express.Router();

const { submitVote } = require("../controllers/voteController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, submitVote);

module.exports = router;