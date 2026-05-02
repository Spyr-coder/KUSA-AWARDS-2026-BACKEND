const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = "kusaawards2026@gmail.com";

exports.adminLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: "Not authorized as admin" });
    }

    const token = jwt.sign(
      {
        id: "admin",
        email,
        role: "ADMIN"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        email,
        role: "ADMIN"
      }
    });

  } catch (err) {
    return res.status(500).json({ error: "Admin login failed" });
  }
};