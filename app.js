// npm i express jsonwebtoken dotenv
// npm i -D nodemon

const app = require("express")();

const posts = [
  {
    username: "Sammy",
    title: "post1",
  },
  {
    username: "Jimmy",
    title: "post2",
  },
];

app.get("/posts", (req, res) => {
  res.json(posts);
});

app.listen(3000);
