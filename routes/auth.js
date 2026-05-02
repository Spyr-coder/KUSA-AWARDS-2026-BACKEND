const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
} = require("../controllers/authController");

const {
  adminLogin,
} = require("../controllers/adminAuthController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/admin-login", adminLogin);

module.exports = router;