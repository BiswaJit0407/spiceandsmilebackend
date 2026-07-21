const mongoose = require("mongoose");

const LangString = { en: String, od: String, hi: String };
const IngredientSchema = new mongoose.Schema(
  { item: String, quantity: String, unit: String },
  { _id: false }
);
const StepSchema = new mongoose.Schema(
  { step: Number, instruction: String, durationMin: Number, imageUrl: String },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    title: LangString,
    description: LangString,
    category: String,
    subcategory: String,
    imageUrl: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorNotes: LangString,
    ingredients: {
      en: [IngredientSchema],
      od: [IngredientSchema],
      hi: [IngredientSchema],
    },
    method: {
      en: [StepSchema],
      od: [StepSchema],
      hi: [StepSchema],
    },
    tips: { en: [String], od: [String], hi: [String] },
    substitutions: {
      en: [{ ingredient: String, substitute: String, _id: false }],
      od: [{ ingredient: String, substitute: String, _id: false }],
      hi: [{ ingredient: String, substitute: String, _id: false }],
    },
    servingSuggestions: LangString,
    prepTime: Number,
    cookTime: Number,
    servings: Number,
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    spiceLevel: { type: Number, min: 0, max: 5, default: 2 },
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    dietaryTags: [String],
    festivalTags: [String],
    status: {
      type: String,
      enum: ["published", "pending", "rejected"],
      default: "pending",
    },
    lockedAt: Date,
    editCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RecipeSchema.index({ status: 1, createdAt: -1 });
RecipeSchema.index({ category: 1 });

module.exports = mongoose.model("Recipe", RecipeSchema);
