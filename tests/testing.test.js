const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const Blog = require("../models/Blog");
const User = require("../models/User");

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

let token;

// Clear the test database and add initial data before each test
beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(initialBlogs);
  await User.deleteMany({});

  // Create and login a user to get a token
  const newUser = {
    username: "test_user",
    name: "Test User",
    password: "password123",
  };
  await api.post("/api/users").send(newUser);

  const loginResponse = await api.post("/api/users/login").send({
    username: newUser.username,
    password: newUser.password,
  });

  token = loginResponse.body.token; // Store the token for authenticated requests
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
  test("POST /api/blogs creates a new blog post with token", async () => {
    const newBlog = {
      title: "New Blog Post",
      author: "John Doe",
      url: "https://example.com/new-blog",
      likes: 10,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`) // ✅ Include token
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAfterPost = await api.get("/api/blogs");
    assert.strictEqual(blogsAfterPost.body.length, initialBlogs.length + 1);

    const titles = blogsAfterPost.body.map((blog) => blog.title);
    assert.ok(titles.includes(newBlog.title), "Expected new blog title to be present");
  });

  test("POST /api/blogs returns 401 if token is missing", async () => {
    const newBlog = {
      title: "Unauthorized Blog",
      author: "Unauthorized User",
      url: "https://example.com/unauthorized",
      likes: 10,
    };

    await api.post("/api/blogs").send(newBlog).expect(401);
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
      .set("Authorization", `Bearer ${token}`) // ✅ Include token
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

    await api.post("/api/blogs").set("Authorization", `Bearer ${token}`).send(newBlog).expect(400);
  });

  test("POST /api/blogs returns 400 if url is missing", async () => {
    const newBlog = {
      title: "Blog without URL",
      author: "John Doe",
      likes: 5,
    };

    await api.post("/api/blogs").set("Authorization", `Bearer ${token}`).send(newBlog).expect(400);
  });

// ✅ Test for 4.13: DELETE
test("DELETE /api/blogs/:id deletes a blog post with token", async () => {
  // Create a blog using the token of the authenticated user
  const newBlog = {
    title: "Blog to be deleted",
    author: "Author Delete",
    url: "https://example.com/delete-blog",
    likes: 5,
  };

  const createdBlog = await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog);

  // Delete the blog using the token of the same user
  await api
    .delete(`/api/blogs/${createdBlog.body.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  // Verify the blog is deleted
  const blogsAfterDelete = await Blog.find({});
  const titles = blogsAfterDelete.map((blog) => blog.title);
  assert.ok(!titles.includes(newBlog.title), "Deleted blog title should not be present");
});


  test("DELETE /api/blogs/:id returns 401 if token is missing", async () => {
    const blogsAtStart = await Blog.find({});
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401);
  });

  test("DELETE /api/blogs/:id returns 404 if blog does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    await api.delete(`/api/blogs/${nonExistentId}`).set("Authorization", `Bearer ${token}`).expect(404);
  });

// ✅ Test for 4.14: PUT
test("PUT /api/blogs/:id updates the number of likes for a blog post", async () => {
  // Create a blog using the token of the authenticated user
  const newBlog = {
    title: "Blog to be updated",
    author: "Author Update",
    url: "https://example.com/update-blog",
    likes: 5,
  };

  const createdBlog = await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog);

  // Update the number of likes
  const updatedBlog = {
    title: createdBlog.body.title,
    author: createdBlog.body.author,
    url: createdBlog.body.url,
    likes: createdBlog.body.likes + 10,
  };

  const response = await api
    .put(`/api/blogs/${createdBlog.body.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  assert.strictEqual(response.body.likes, createdBlog.body.likes + 10, "Likes should be updated");
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

describe("User API tests", () => {
  // ✅ Test GET /api/users
  test("GET /api/users returns all users", async () => {
    const response = await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(Array.isArray(response.body), true, "Expected response to be an array");
  });

  // ✅ Test POST /api/users
  test("POST /api/users creates a new user", async () => {
    const newUser = {
      username: "john_doe",
      name: "John Doe",
      password: "password123",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAfterPost = await api.get("/api/users");
    const usernames = usersAfterPost.body.map((user) => user.username);
    assert.ok(usernames.includes(newUser.username), "Expected new user username to be present");
  });

  // ✅ Test POST /api/users with short password
  test("POST /api/users returns 400 if password is too short", async () => {
    const newUser = {
      username: "short_password",
      name: "Short Password",
      password: "pw",
    };

    const response = await api.post("/api/users").send(newUser).expect(400);
    assert.strictEqual(response.body.error, "Password must be at least 3 characters long");
  });

  // ✅ Test POST /api/users with short username
  test("POST /api/users returns 400 if username is too short", async () => {
    const newUser = {
      username: "jd",
      name: "Short Username",
      password: "password123",
    };

    const response = await api.post("/api/users").send(newUser).expect(400);
    assert.strictEqual(response.body.error, "Username must be at least 3 characters long");
  });

  // ✅ Test POST /api/users with missing username
  test("POST /api/users returns 400 if username is missing", async () => {
    const newUser = {
      name: "Missing Username",
      password: "password123",
    };

    const response = await api.post("/api/users").send(newUser).expect(400);
    assert.strictEqual(response.body.error, "Username must be at least 3 characters long");
  });

  // ✅ Test POST /api/users with missing password
  test("POST /api/users returns 400 if password is missing", async () => {
    const newUser = {
      username: "john_doe",
      name: "Missing Password",
    };

    const response = await api.post("/api/users").send(newUser).expect(400);
    assert.strictEqual(response.body.error, "Password must be at least 3 characters long");
  });

  // ✅ Test POST /api/users with duplicate username
  test("POST /api/users returns 400 if username is not unique", async () => {
    const newUser = {
      username: "duplicate_user",
      name: "Duplicate User",
      password: "password123",
    };

    await api.post("/api/users").send(newUser).expect(201);

    const response = await api.post("/api/users").send(newUser).expect(400);
    assert.strictEqual(response.body.error, "Username must be unique");
  });

  // Test POST /api/users/login returns a token
  test("POST /api/users/login returns a token", async () => {
    const loginResponse = await api
      .post("/api/users/login")
      .send({
        username: "test_user",
        password: "password123",
      })
      .expect(200);

    assert.ok(loginResponse.body.token, "Expected login to return a token");
  });

  test("POST /api/users/login returns 401 for invalid credentials", async () => {
    await api
      .post("/api/users/login")
      .send({
        username: "test_user",
        password: "wrongpassword",
      })
      .expect(401);
  });
});

// ✅ Close DB connection after all tests
after(async () => {
  await mongoose.connection.close();
});
