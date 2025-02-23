const BlogRouter = require("express").Router();
const Blog = require("../models/Blog");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// ✅ Middleware to extract token
const getTokenFrom = (request) => {
  const authorization = request.get("Authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

// ✅ GET all blogs
BlogRouter.get("/", async (request, response, next) => {
  try {
    const blogs = await Blog.find({}).populate("user", {
      username: 1,
      name: 1,
      id: 1,
    });
    response.json(blogs);
  } catch (error) {
    next(error);
  }
});

// ✅ POST a new blog (Requires token)
BlogRouter.post("/", async (request, response, next) => {
  try {
    const { title, author, url, likes } = request.body;

    const token = getTokenFrom(request);
    if (!token) {
      return response.status(401).json({ error: "Token missing or invalid" });
    }

    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "Token invalid" });
    }

    const user = await User.findById(decodedToken.id);

    if (!title || !url) {
      return response.status(400).json({ error: "Title and URL are required" });
    }

    const blog = new Blog({
      title,
      author,
      url,
      likes: likes !== undefined ? likes : 0,
      user: user._id,
    });

    const savedBlog = await blog.save();

    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    const populatedBlog = await Blog.findById(savedBlog._id).populate("user", {
      username: 1,
      name: 1,
      id: 1,
    });

    response.status(201).json(populatedBlog);
  } catch (error) {
    next(error);
  }
});


// ✅ DELETE a blog by ID (Requires token)
BlogRouter.delete("/:id", async (request, response, next) => {
  try {
    const token = getTokenFrom(request);
    if (!token) {
      return response.status(401).json({ error: "Token missing or invalid" });
    }

    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "Token invalid" });
    }

    const blog = await Blog.findById(request.params.id);
    if (!blog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    // ✅ Ensure `blog.user` exists before calling `.toString()`
    if (!blog.user || blog.user.toString() !== decodedToken.id) {
      return response.status(403).json({ error: "Unauthorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(request.params.id);

    // ✅ Remove blog reference from user's `blogs` array
    const user = await User.findById(decodedToken.id);
    if (user) {
      user.blogs = user.blogs.filter((b) => b.toString() !== blog._id.toString());
      await user.save();
    }

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});


// ✅ PUT update a blog by ID
BlogRouter.put("/:id", async (request, response, next) => {
  try {
    const { title, author, url, likes } = request.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      { title, author, url, likes },
      { new: true, runValidators: true }
    ).populate("user", {
      username: 1,
      name: 1,
      id: 1,
    });

    if (!updatedBlog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    response.json(updatedBlog);
  } catch (error) {
    next(error);
  }
});


module.exports = BlogRouter;
