const express = require("express");
const Festival = require("../models/Festival");
const router = express.Router();

router.get("/", async (_req, res) => {
  res.json(await Festival.find().sort({ month: 1, day: 1 }));
});

module.exports = router;
