const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  name: { en: String, od: String, hi: String },
  emoji: String,
  recipeCount: { type: Number, default: 0 },
  subcategories: [String],
});

module.exports = mongoose.model("Category", CategorySchema);
