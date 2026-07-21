const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const Category = require("../models/Category");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { categories, generateRecipes } = require("./recipesData");

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/spiceandsoul";
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB!");

    // Clear existing data
    console.log("Clearing existing Categories and Recipes...");
    await Category.deleteMany({});
    await Recipe.deleteMany({});

    // Find existing Author
    console.log("Finding existing admin...");
    const author = await User.findOne({ email: "admin@example.com" });
    
    if (!author) {
      console.error("Error: admin@example.com not found. Please register this user first.");
      process.exit(1);
    }

    // Seed Categories
    console.log("Seeding categories...");
    const createdCategories = await Category.insertMany(categories);
    console.log(`Seeded ${createdCategories.length} categories.`);

    // Generate 50 Recipes
    console.log("Generating 50 recipes...");
    const recipesData = generateRecipes(author._id, createdCategories);

    // Insert Recipes
    console.log("Seeding recipes...");
    const createdRecipes = await Recipe.insertMany(recipesData);
    console.log(`Seeded ${createdRecipes.length} recipes successfully!`);

    console.log("Updating category recipe counts...");
    for (const category of createdCategories) {
      const count = await Recipe.countDocuments({ category: category.slug });
      await Category.findByIdAndUpdate(category._id, { recipeCount: count });
    }
    console.log("Category counts updated.");

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
}

seedDatabase();
