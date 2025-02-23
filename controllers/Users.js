const UserRouter = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt"); // or "bcryptjs"
const jwt = require("jsonwebtoken");

// GET all users (populate their blogs)
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

// POST create a new user
UserRouter.post("/", async (request, response, next) => {
  try {
    const { username, name, password } = request.body;

    if (!username || username.length < 3) {
      return response.status(400).json({ error: "Username must be at least 3 characters long" });
    }

    if (!password || password.length < 3) {
      return response.status(400).json({ error: "Password must be at least 3 characters long" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.status(400).json({ error: "Username must be unique" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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

// POST login user (Token Authentication)
UserRouter.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const user = await User.findOne({ username });
  const passwordCorrect = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordCorrect) {
    return response.status(401).json({ error: "Invalid username or password" });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  // Token expires in 1 hour
  const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: "1h" });

  response.status(200).send({
    token,
    username: user.username,
    name: user.name,
  });
});

module.exports = UserRouter;
