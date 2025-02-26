const express = require('express');
const Blog = require('../models/Blog');
const User = require('../models/User');

const router = express.Router();

// ✅ Reset Route: Deletes all blogs and users
router.post('/reset', async (req, res) => {
  await Blog.deleteMany({});
  await User.deleteMany({});
  res.status(204).end();
});

module.exports = router;
