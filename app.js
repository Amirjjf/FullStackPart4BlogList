const express = require("express");
const app = express();
const cors = require("cors");
const BlogRouter = require("./controllers/Blogs");
const mongoose = require("mongoose");
const cofig = require("./utils/config");
const logger = require("./utils/logger");

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

module.exports = app;
