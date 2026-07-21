require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const categoryRoutes = require("./routes/categories");
const festivalRoutes = require("./routes/festivals");
const newsletterRoutes = require("./routes/newsletter");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const { startNewsletterCron, startQuotaResetCron } = require("./services/cron");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/festivals", festivalRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
    startNewsletterCron();
    startQuotaResetCron();
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err);
    process.exit(1);
  });
