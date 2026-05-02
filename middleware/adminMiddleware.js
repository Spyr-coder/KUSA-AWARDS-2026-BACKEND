module.exports = function adminMiddleware(req, res, next) {
  const ADMIN_EMAIL = "kusaawards2026@gmail.com";

  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({
      error: "Admin access required"
    });
  }

  next();
};