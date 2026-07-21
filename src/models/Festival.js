const mongoose = require("mongoose");

const FestivalSchema = new mongoose.Schema({
  name: { en: String, od: String, hi: String },
  month: Number,
  day: Number,
  description: { en: String, od: String, hi: String },
  recipeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
});

module.exports = mongoose.model("Festival", FestivalSchema);
