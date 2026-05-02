const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // =========================
    // GET AUTH HEADER
    // =========================
    const authHeader = req.headers.authorization;

    // CHECK HEADER EXISTS
    if (!authHeader) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    // CHECK FORMAT
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format",
      });
    }

    // =========================
    // EXTRACT TOKEN
    // =========================
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token missing",
      });
    }

    // =========================
    // VERIFY TOKEN
    // =========================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log("TOKEN USER ID:", decoded.id);
    console.log("✅ JWT DECODED:", decoded);

    // =========================
    // VALIDATE USER ID
    // =========================
    if (!decoded.id) {
      return res.status(401).json({
        error: "Invalid token payload",
      });
    }

    // =========================
    // ATTACH USER
    // =========================
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();

  } catch (err) {
    console.error("🔥 AUTH MIDDLEWARE ERROR:", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};

module.exports = authMiddleware;