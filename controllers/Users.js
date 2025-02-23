const UserRouter = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt"); // or "bcryptjs"

// ✅ GET all users (populate their blogs)
UserRouter.get("/", async (request, response, next) => {
  try {
    const users = await User.find({}).populate("blogs", {
      title: 1,
      author: 1,
      url: 1,
      id: 1,
    });
    response.json(users);
  } catch (error) {
    next(error);
  }
});

// ✅ POST create a new user
UserRouter.post("/", async (request, response, next) => {
  try {
    const { username, name, password } = request.body;

    // ✅ Validate username and password
    if (!username || username.length < 3) {
      return response.status(400).json({
        error: "Username must be at least 3 characters long",
      });
    }

    if (!password || password.length < 3) {
      return response.status(400).json({
        error: "Password must be at least 3 characters long",
      });
    }

    // ✅ Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.status(400).json({
        error: "Username must be unique",
      });
    }

    // ✅ Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ✅ Create and save the user
    const user = new User({
      username,
      name,
      passwordHash,
    });

    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = UserRouter;
