const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = "kusaawards2026@gmail.com";

exports.adminLogin = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("ADMIN LOGIN ATTEMPT:", email);

    // =========================
    // VALIDATE EMAIL
    // =========================
    if (!email) {
      return res.status(400).json({
        error: "Email required",
      });
    }

    // =========================
    // CHECK ADMIN EMAIL
    // =========================
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({
        error: "Not authorized as admin",
      });
    }

    // =========================
    // CHECK JWT SECRET
    // =========================
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET MISSING");

      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    // =========================
    // CREATE TOKEN
    // =========================
    const token = jwt.sign(
      {
        id: "admin",
        email,
        role: "ADMIN",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log("ADMIN TOKEN CREATED");

    // =========================
    // SUCCESS
    // =========================
    return res.json({
      token,
      user: {
        email,
        role: "ADMIN",
      },
    });

  } catch (err) {

    console.error("ADMIN LOGIN ERROR:", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      error: "Admin login failed",
    });
  }
};
