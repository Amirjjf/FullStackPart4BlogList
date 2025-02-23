const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Blog = require("../models/Blog");

const api = supertest(app);

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
];

// Clear the test database and add initial test blogs before each test
beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(initialBlogs);
});

describe("API tests for blog list", () => {
  // ✅ Test for 4.8
  test("GET /api/blogs returns blogs as JSON and correct number of blogs", async () => {
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.length, initialBlogs.length);
  });

  // ✅ Test for 4.9
  test("unique identifier property of blog posts is named id", async () => {
    const response = await api.get("/api/blogs");

    response.body.forEach((blog) => {
      assert.ok(blog.id, "Expected blog to have 'id' property");
      assert.strictEqual(blog._id, undefined, "Expected blog NOT to have '_id' property");
    });
  });

  // ✅ Test for 4.10
  test("POST /api/blogs creates a new blog post", async () => {
    const newBlog = {
      title: "New Blog Post",
      author: "John Doe",
      url: "https://example.com/new-blog",
      likes: 10,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAfterPost = await api.get("/api/blogs");
    assert.strictEqual(blogsAfterPost.body.length, initialBlogs.length + 1);

    const titles = blogsAfterPost.body.map((blog) => blog.title);
    assert.ok(titles.includes(newBlog.title), "Expected new blog title to be present");
  });

  // ✅ Test for 4.11
  test("POST /api/blogs defaults likes to 0 if missing", async () => {
    const newBlog = {
      title: "Blog without likes",
      author: "Jane Doe",
      url: "https://example.com/no-likes",
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, 0, "Expected likes to default to 0");
  });

  // ✅ Test for 4.12
  test("POST /api/blogs returns 400 if title is missing", async () => {
    const newBlog = {
      author: "John Doe",
      url: "https://example.com/no-title",
      likes: 5,
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });

  test("POST /api/blogs returns 400 if url is missing", async () => {
    const newBlog = {
      title: "Blog without URL",
      author: "John Doe",
      likes: 5,
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });

  // ✅ Test for 4.13: DELETE
  test("DELETE /api/blogs/:id deletes a blog post", async () => {
    const blogsAtStart = await Blog.find({});
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAfterDelete = await Blog.find({});
    assert.strictEqual(blogsAfterDelete.length, blogsAtStart.length - 1);

    const titles = blogsAfterDelete.map((blog) => blog.title);
    assert.ok(!titles.includes(blogToDelete.title), "Deleted blog title should not be present");
  });

  test("DELETE /api/blogs/:id returns 404 if blog does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    await api.delete(`/api/blogs/${nonExistentId}`).expect(404);
  });

  // ✅ Test for 4.14: PUT
  test("PUT /api/blogs/:id updates the number of likes for a blog post", async () => {
    const blogsAtStart = await Blog.find({});
    const blogToUpdate = blogsAtStart[0];

    const updatedBlog = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: blogToUpdate.likes + 10,
    };

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, blogToUpdate.likes + 10, "Likes should be updated");
  });

  test("PUT /api/blogs/:id returns 404 if blog does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const updatedBlog = {
      title: "Non-existent blog",
      author: "Unknown",
      url: "https://example.com",
      likes: 100,
    };

    await api.put(`/api/blogs/${nonExistentId}`).send(updatedBlog).expect(404);
  });
});

// ✅ Close DB connection after all tests
after(async () => {
  await mongoose.connection.close();
});
