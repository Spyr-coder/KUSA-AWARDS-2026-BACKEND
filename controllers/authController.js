const { prisma } = require("../lib/prisma");
const { sendOTP } = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/* =========================
   SEND OTP
========================= */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    /* =========================
       STRICT DOMAIN CHECK
    ========================= */
   const normalizedEmail = email.trim().toLowerCase();

// KU allowed domain
const ALLOWED_DOMAIN = "@students.ku.ac.ke";

// admin override email
const ADMIN_EMAIL = "kusaawards2026@gmail.com";

const isAllowed =
  normalizedEmail === ADMIN_EMAIL ||
  normalizedEmail.endsWith(ALLOWED_DOMAIN);

if (!isAllowed) {
  return res.status(403).json({
    error: "Only KU student emails allowed",
  });
}

    /* =========================
       RATE LIMIT PROTECTION
    ========================= */
    const recentOtp = await prisma.oTP.findFirst({
      where: {
        email,
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
        email,
        code: hashedCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOTP(email, code);

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

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const otp = await prisma.oTP.findFirst({
      where: {
        email,
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

    await prisma.oTP.deleteMany({
      where: { email },
    });

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          provider: "otp",
          googleId: email,
          role:
            email === "kusaawards2026@gmail.com"
              ? "ADMIN"
              : "USER",
        },
      });
    }

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
