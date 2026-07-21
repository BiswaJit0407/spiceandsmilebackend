const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signAccess(user) {
  return jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

function signRefresh(user, remember) {
  return jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: remember ? "90d" : "30d",
  });
}

function signEmailToken(userId) {
  return jwt.sign({ sub: userId, purpose: "verify" }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

module.exports = { signAccess, signRefresh, signEmailToken, requireAuth, requireAdmin };
