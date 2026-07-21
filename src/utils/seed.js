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
    console.log("Clearing existing Categories, Recipes, and Users...");
    await Category.deleteMany({});
    await Recipe.deleteMany({});
    await User.deleteMany({});

    // Create a default Author
    console.log("Creating default author...");
    const author = await User.create({
      name: "Master Chef",
      email: "chef@spiceandsoul.com",
      passwordHash: "hashedpassword123", // usually hashed, but this is just seed data
      role: "admin",
    });

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
