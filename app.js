require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const BlogRouter = require("./controllers/Blogs");
const UserRouter = require("./controllers/Users");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware"); 

app.use(express.json());
app.use(cors());

logger.info("connecting to", process.env.MONGODB_URL);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error.message);
  });

// Apply tokenExtractor globally
app.use(middleware.tokenExtractor);

// Apply userExtractor only to /api/blogs routes
app.use("/api/blogs", middleware.userExtractor, BlogRouter);
app.use("/api/users", UserRouter);

// Error handler middleware
app.use((error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "Invalid token" });
  }

  next(error);
});

module.exports = app;
