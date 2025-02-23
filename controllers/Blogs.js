const BlogRouter = require("express").Router();
const Blog = require("../models/Blog");
const User = require("../models/User");

// ✅ GET all blogs (populate user info)
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

// ✅ POST a new blog (assign a random user as creator)
BlogRouter.post("/", async (request, response, next) => {
  try {
    const { title, author, url, likes } = request.body;

    if (!title || !url) {
      return response.status(400).json({ error: "Title and URL are required" });
    }

    // ✅ Assign a random user from the database as the creator
    const users = await User.find({});
    if (users.length === 0) {
      return response.status(400).json({ error: "No users found in the database" });
    }
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // ✅ Create and save the blog
    const blog = new Blog({
      title,
      author,
      url,
      likes: likes !== undefined ? likes : 0,
      user: randomUser._id, // Reference the user's ID
    });

    const savedBlog = await blog.save();

    // ✅ Add the blog to the user's list of blogs
    randomUser.blogs = randomUser.blogs.concat(savedBlog._id);
    await randomUser.save();

    // ✅ Populate user info before responding
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

// ✅ DELETE a blog by ID
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

// ✅ PUT update a blog by ID
BlogRouter.put("/:id", async (request, response, next) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      request.body,
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
