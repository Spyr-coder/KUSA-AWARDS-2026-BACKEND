const rateLimit = require("express-rate-limit");

// STRONG LIMIT FOR VOTING ONLY
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // only 3 vote attempts per minute per IP
  message: "You're voting too fast. Slow down.",
});

module.exports = voteLimiter;