const express = require("express");
const Blog = require("../models/Blog");
const User = require("../models/User");

const router = express.Router();

// ✅ Only allow deletion in test mode
router.post("/reset", async (req, res) => {
  if (process.env.NODE_ENV !== "test") {
    return res.status(403).json({ error: "Forbidden: Cannot reset non-test database" });
  }

  console.log("Resetting test database...");
  await Blog.deleteMany({});
  await User.deleteMany({});
  res.status(204).end();
});

module.exports = router;
