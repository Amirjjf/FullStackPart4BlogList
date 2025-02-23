require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const BlogRouter = require("./controllers/Blogs");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const UserRouter = require("./controllers/Users");

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

app.use("/api/blogs", BlogRouter);
app.use("/api/users", UserRouter);

// ✅ Token Extractor Middleware
const tokenExtractor = (request, response, next) => {
  const authorization = request.get("Authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    request.token = authorization.substring(7);
  }
  next();
};

app.use(tokenExtractor);

// ✅ Error handler middleware
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
