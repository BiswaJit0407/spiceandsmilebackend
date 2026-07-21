const express = require("express");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/saved-recipes", requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedRecipes");
  res.json(user.savedRecipes);
});

router.post("/saved-recipes/:id", requireAuth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ error: "Not found" });
  const u = req.user;
  const idx = u.savedRecipes.findIndex((r) => String(r) === req.params.id);
  if (idx >= 0) u.savedRecipes.splice(idx, 1);
  else u.savedRecipes.push(recipe._id);
  await u.save();
  res.json({ saved: idx < 0 });
});

module.exports = router;
