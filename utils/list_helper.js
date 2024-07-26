const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  const maxLikes = Math.max(...blogs.map((blog) => blog.likes));
  return blogs.find((blog) => blog.likes === maxLikes);
};

const mostBlogs = (blogs) => {
  const authors = blogs.reduce((authors, blog) => {
    authors[blog.author] = authors[blog.author] + 1 || 1;
    return authors;
  }, {});

  const maxBlogs = Math.max(...Object.values(authors));
  const author = Object.keys(authors).find(
    (author) => authors[author] === maxBlogs
  );

  return { author, blogs: maxBlogs };
};

const mostLikes = (blogs) => {
  const authors = blogs.reduce((authors, blog) => {
    authors[blog.author] = authors[blog.author] + blog.likes || blog.likes;
    return authors;
  }, {});

  const maxLikes = Math.max(...Object.values(authors));
  const author = Object.keys(authors).find(
    (author) => authors[author] === maxLikes
  );

  return { author, likes: maxLikes };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
