const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Token Extractor Middleware (Globally applied)
const tokenExtractor = (request, response, next) => {
  const authorization = request.get("Authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    request.token = authorization.substring(7);
  }
  next();
};

// User Extractor Middleware (For /api/blogs)
const userExtractor = async (request, response, next) => {
  try {
    if (request.token) {
      const decodedToken = jwt.verify(request.token, process.env.SECRET);
      if (decodedToken.id) {
        request.user = await User.findById(decodedToken.id); // Set user in request object
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  tokenExtractor,
  userExtractor,
};
