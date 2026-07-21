const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipeData: { type: Object, required: true },
    imageUrls: [String],
    aiValidation: {
      isValid: Boolean,
      reason: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: String,
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedRecipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", SubmissionSchema);
