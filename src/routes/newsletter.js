const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.post("/subscribe", async (req, res) => {
  const { email, name, language = "en" } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.newsletterSubscribed = true;
    user.newsletterPreferences = { ...user.newsletterPreferences, language };
    await user.save();
    return res.json({ ok: true });
  }
  // create a lightweight, unverified subscriber shell
  await User.create({
    name: name || email.split("@")[0],
    email: email.toLowerCase(),
    passwordHash: "!",
    newsletterSubscribed: true,
    newsletterPreferences: { language },
    verified: true, // subscriber-only, no login
  });
  res.json({ ok: true });
});

router.post("/unsubscribe", async (req, res) => {
  const { userId } = req.body || {};
  await User.findByIdAndUpdate(userId, { newsletterSubscribed: false });
  res.json({ ok: true });
});

router.patch("/preferences", requireAuth, async (req, res) => {
  const { language, categories, subscribed } = req.body || {};
  const u = req.user;
  if (typeof subscribed === "boolean") u.newsletterSubscribed = subscribed;
  if (language) u.newsletterPreferences.language = language;
  if (Array.isArray(categories)) u.newsletterPreferences.categories = categories;
  await u.save();
  res.json({ ok: true });
});

module.exports = router;
