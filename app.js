const express = require("express");
const app = express();
const cors = require("cors");
const BlogRouter = require("./controllers/Blogs");
const mongoose = require("mongoose");
const cofig = require("./utils/config");
const logger = require("./utils/logger");
const UserRouter = require("./controllers/Users");

app.use(express.json());
app.use(cors());

logger.info("connecting to", cofig.MONGODB_URL);

const mongoUrl = cofig.MONGODB_URL;
mongoose
  .connect(mongoUrl)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error.message);
  });

app.use("/api/Blogs", BlogRouter);
app.use("/api/users", UserRouter);


// Error handler middleware
app.use((error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  if (error.code === 11000) {
    // MongoDB duplicate key error for unique fields
    return response.status(400).json({ error: "Username must be unique" });
  }

  next(error);
});



module.exports = app;
