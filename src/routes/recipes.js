const express = require("express");
const Recipe = require("../models/Recipe");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const validateRecipe = require("../services/validateRecipe");
const { streamRecipePdf } = require("../services/pdf");
const upload = require("../utils/upload");

const router = express.Router();

// Public list with filters
router.get("/", async (req, res) => {
  const { category, spice, maxTime, maxCalories, q, limit = 24, page = 1 } = req.query;
  const filter = { status: "published" };
  if (category) filter.category = category;
  if (spice) filter.spiceLevel = { $lte: Number(spice) };
  if (maxTime) filter.$expr = { $lte: [{ $add: ["$prepTime", "$cookTime"] }, Number(maxTime)] };
  if (maxCalories) filter.calories = { $lte: Number(maxCalories) };
  if (q) filter["title.en"] = new RegExp(q, "i");

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Recipe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Recipe.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page) });
});

router.get("/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate("authorId", "name");
  if (!recipe || recipe.status !== "published")
    return res.status(404).json({ error: "Not found" });
  recipe.viewsCount += 1;
  await recipe.save();
  res.json(recipe);
});

router.get("/:id/pdf", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe || recipe.status !== "published")
    return res.status(404).json({ error: "Not found" });
  const lang = ["en", "od", "hi"].includes(req.query.lang) ? req.query.lang : "en";
  streamRecipePdf(recipe, res, lang);
});

// Image upload (single) — returns URL for use in recipe payload
router.post("/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Submit a recipe (goes through AI validation + admin approval)
router.post("/", requireAuth, async (req, res) => {
  const user = req.user;
  const now = new Date();

  // Quota checks
  const today = now.toISOString().slice(0, 10);
  const lastDay = user.lastPostDate ? user.lastPostDate.toISOString().slice(0, 10) : null;
  if (lastDay !== today) {
    user.postCountToday = 0;
    user.lastPostDate = now;
  }
  if (user.postCountToday >= 1)
    return res.status(429).json({ error: "You can post 1 recipe per day." });
  if (user.postCountThisMonth >= 15)
    return res.status(429).json({ error: "Monthly limit of 15 recipes reached." });
  if (user.nextPostAvailableAt && user.nextPostAvailableAt > now) {
    return res.status(429).json({
      error: `Please wait until ${user.nextPostAvailableAt.toISOString()} to post again.`,
    });
  }

  const data = req.body || {};
  const titleEn = data.title?.en;
  if (!titleEn) return res.status(400).json({ error: "English title required" });

  const ai = await validateRecipe({
    title: titleEn,
    ingredients: data.ingredients?.en || [],
    method: data.method?.en || [],
  });

  const submission = await Submission.create({
    userId: user._id,
    recipeData: data,
    imageUrls: data.imageUrl ? [data.imageUrl] : [],
    aiValidation: ai,
    status: ai.isValid ? "pending" : "rejected",
    rejectionReason: ai.isValid ? undefined : ai.reason,
    reviewedAt: ai.isValid ? undefined : new Date(),
  });

  if (!ai.isValid) {
    user.rejectionsThisMonth += 1;
    if (user.rejectionsThisMonth === 2)
      user.nextPostAvailableAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    if (user.rejectionsThisMonth === 3)
      user.nextPostAvailableAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    await user.save();
    return res.status(400).json({ error: `Rejected: ${ai.reason}`, submission });
  }

  user.postCountToday += 1;
  user.postCountThisMonth += 1;
  user.lastPostDate = now;
  await user.save();
  res.json({ ok: true, submission });
});

// Edit (30-min free window, then one more edit, then locked)
router.patch("/:id", requireAuth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ error: "Not found" });
  if (String(recipe.authorId) !== String(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Not your recipe" });

  const ageMs = Date.now() - new Date(recipe.createdAt).getTime();
  const withinFreeWindow = ageMs < 30 * 60 * 1000;
  if (!withinFreeWindow) {
    if (recipe.editCount >= 1)
      return res.status(423).json({ error: "Recipe is locked. Delete + repost for major changes." });
    recipe.editCount += 1;
  }
  Object.assign(recipe, req.body);
  recipe.lockedAt = withinFreeWindow ? null : new Date();
  await recipe.save();
  res.json(recipe);
});

module.exports = router;
