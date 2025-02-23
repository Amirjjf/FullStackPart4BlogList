const BlogRouter = require("express").Router();
const Blog = require("../models/Blog");

// GET all blogs
BlogRouter.get("/", async (request, response, next) => {
  try {
    const blogs = await Blog.find({});
    response.json(blogs);
  } catch (error) {
    next(error);
  }
});

// POST a new blog
BlogRouter.post("/", async (request, response, next) => {
  try {
    const { title, author, url, likes } = request.body;

    if (!title || !url) {
      return response.status(400).json({ error: "Title and URL are required" });
    }

    const blog = new Blog({
      title,
      author,
      url,
      likes: likes !== undefined ? likes : 0,
    });

    const result = await blog.save();
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE a blog by ID (4.13)
BlogRouter.delete("/:id", async (request, response, next) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(request.params.id);

    if (!deletedBlog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    response.status(204).end(); // 204 No Content
  } catch (error) {
    next(error);
  }
});

// PUT update a blog by ID (4.14)
BlogRouter.put("/:id", async (request, response, next) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    response.json(updatedBlog);
  } catch (error) {
    next(error);
  }
});

module.exports = BlogRouter;
