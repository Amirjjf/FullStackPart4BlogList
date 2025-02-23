const BlogRouter = require("express").Router();
const Blog = require("../models/Blog");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


// GET all blogs
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

BlogRouter.post("/", async (request, response, next) => {
  try {
    const { title, author, url, likes } = request.body;

    if (!request.user) {
      return response.status(401).json({ error: "Token missing or invalid" });
    }

    if (!title || !url) {
      return response.status(400).json({ error: "Title and URL are required" });
    }

    const blog = new Blog({
      title,
      author,
      url,
      likes: likes !== undefined ? likes : 0,
      user: request.user._id, // ✅ Use user from request object
    });

    const savedBlog = await blog.save();

    request.user.blogs = request.user.blogs.concat(savedBlog._id);
    await request.user.save();

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


BlogRouter.delete("/:id", async (request, response, next) => {
  try {
    if (!request.user) {
      return response.status(401).json({ error: "Token missing or invalid" });
    }

    const blog = await Blog.findById(request.params.id);
    if (!blog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    if (!blog.user || blog.user.toString() !== request.user._id.toString()) {
      return response.status(403).json({ error: "Unauthorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(request.params.id);

    request.user.blogs = request.user.blogs.filter(
      (b) => b.toString() !== blog._id.toString()
    );
    await request.user.save();

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

// PUT update a blog by ID
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
