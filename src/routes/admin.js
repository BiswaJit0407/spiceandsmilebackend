const express = require("express");
const Submission = require("../models/Submission");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sendRejectionEmail } = require("../services/mailer");

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/submissions", async (req, res) => {
  const status = req.query.status || "pending";
  const items = await Submission.find({ status })
    .sort({ submittedAt: 1 })
    .populate("userId", "name email");
  res.json(items);
});

router.patch("/submissions/:id", async (req, res) => {
  const { action, reason } = req.body || {};
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).json({ error: "Not found" });

  if (action === "approve") {
    const recipe = await Recipe.create({
      ...sub.recipeData,
      authorId: sub.userId,
      status: "published",
    });
    sub.status = "approved";
    sub.publishedRecipeId = recipe._id;
    sub.reviewedAt = new Date();
    sub.reviewedBy = req.user._id;
    await sub.save();
    return res.json({ ok: true, recipe });
  }

  if (action === "reject") {
    sub.status = "rejected";
    sub.rejectionReason = reason || "Does not meet guidelines";
    sub.reviewedAt = new Date();
    sub.reviewedBy = req.user._id;
    await sub.save();
    const user = await User.findById(sub.userId);
    if (user) {
      user.rejectionsThisMonth += 1;
      await user.save();
      try {
        await sendRejectionEmail(user, sub.recipeData?.title?.en || "your recipe", sub.rejectionReason);
      } catch (err) {
        console.error("rejection email failed", err.message);
      }
    }
    return res.json({ ok: true });
  }

  res.status(400).json({ error: "Unknown action" });
});

module.exports = router;
