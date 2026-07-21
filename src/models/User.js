const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationMethod: { type: String, enum: ["email", "phone"], default: "email" },
    role: { type: String, enum: ["member", "contributor", "admin"], default: "member" },
    postCountThisMonth: { type: Number, default: 0 },
    postCountToday: { type: Number, default: 0 },
    lastPostDate: Date,
    rejectionsThisMonth: { type: Number, default: 0 },
    nextPostAvailableAt: Date,
    newsletterSubscribed: { type: Boolean, default: true },
    newsletterPreferences: {
      language: { type: String, enum: ["en", "od", "hi"], default: "en" },
      categories: [String],
    },
    savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
    lastLogin: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
