const { prisma } = require("../lib/prisma");
const { sendOTP } = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/* =========================
   CONSTANTS
========================= */
const ADMIN_EMAIL = "kusaawards2026@gmail.com";
const ALLOWED_DOMAIN = "@students.ku.ac.ke";

/* =========================
   SEND OTP
========================= */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    // ✅ NORMALIZE EMAIL (CRITICAL)
    const normalizedEmail = email.trim().toLowerCase();

    /* =========================
       DOMAIN CHECK
    ========================= */
    const isAllowed =
      normalizedEmail === ADMIN_EMAIL ||
      normalizedEmail.endsWith(ALLOWED_DOMAIN);

    if (!isAllowed) {
      return res.status(403).json({
        error: "Only KU student emails allowed",
      });
    }

    /* =========================
       RATE LIMIT (ANTI-SPAM)
    ========================= */
    const recentOtp = await prisma.oTP.findFirst({
      where: {
        email: normalizedEmail, // ✅ FIXED
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      return res.status(429).json({
        error: "Please wait before requesting another OTP",
      });
    }

    /* =========================
       GENERATE OTP
    ========================= */
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    /* =========================
       STORE OTP
    ========================= */
    await prisma.oTP.create({
      data: {
        email: normalizedEmail, // ✅ FIXED
        code: hashedCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    /* =========================
       SEND EMAIL
    ========================= */
    await sendOTP(normalizedEmail, code); // ✅ FIXED

    return res.json({
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("OTP SEND ERROR:", err);

    return res.status(500).json({
      error: "Failed to send OTP",
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        error: "Email and OTP required",
      });
    }

    // ✅ NORMALIZE EMAIL AGAIN (CRITICAL)
    const normalizedEmail = email.trim().toLowerCase();

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    /* =========================
       FIND VALID OTP
    ========================= */
    const otp = await prisma.oTP.findFirst({
      where: {
        email: normalizedEmail, // ✅ FIXED
        code: hashedCode,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!otp) {
      return res.status(400).json({
        error: "Invalid or expired OTP",
      });
    }

    /* =========================
       DELETE USED OTPs
    ========================= */
    await prisma.oTP.deleteMany({
      where: { email: normalizedEmail }, // ✅ FIXED
    });

    /* =========================
       FIND OR CREATE USER
    ========================= */
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }, // ✅ FIXED
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail, // ✅ FIXED
          name: normalizedEmail.split("@")[0],
          provider: "otp",
          googleId: normalizedEmail,
          role:
            normalizedEmail === ADMIN_EMAIL
              ? "ADMIN"
              : "USER",
        },
      });
    }

    /* =========================
       GENERATE JWT
    ========================= */
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);

    return res.status(500).json({
      error: "Verification failed",
    });
  }
};
