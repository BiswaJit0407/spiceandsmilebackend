const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  signAccess,
  signRefresh,
  signEmailToken,
  requireAuth,
} = require("../middleware/auth");
const { sendVerificationEmail } = require("../services/mailer");

const router = express.Router();

const signupLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 3 });

const passwordOk = (p) =>
  typeof p === "string" && p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);

router.post("/signup", signupLimiter, async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });
  if (!passwordOk(password))
    return res
      .status(400)
      .json({ error: "Password needs 8+ chars, 1 uppercase, 1 number" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const role =
    process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
      ? "admin"
      : "member";
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    verificationMethod: "email",
  });

  const token = signEmailToken(user._id);
  const verifyUrl = `${process.env.CLIENT_URL}/verify?token=${token}`;
  try {
    await sendVerificationEmail(user, verifyUrl);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
  res.json({ ok: true, message: "Check your email to verify your account" });
});

router.get("/verify/:token", async (req, res) => {
  try {
    const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (payload.purpose !== "verify") throw new Error("bad token");
    const user = await User.findByIdAndUpdate(
      payload.sub,
      { verified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid or expired verification link" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password, remember } = req.body || {};
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.verified)
    return res.status(403).json({ error: "Please verify your email first" });

  user.lastLogin = new Date();
  await user.save();

  res.json({
    accessToken: signAccess(user),
    refreshToken: signRefresh(user, remember),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new Error();
    res.json({ accessToken: signAccess(user) });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    verified: u.verified,
    postCountThisMonth: u.postCountThisMonth,
    newsletterSubscribed: u.newsletterSubscribed,
    newsletterPreferences: u.newsletterPreferences,
  });
});

module.exports = router;
