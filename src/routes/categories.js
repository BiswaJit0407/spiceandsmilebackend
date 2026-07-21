const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (_req, res) => {
  res.json(await Category.find().sort({ slug: 1 }));
});

module.exports = router;
