// npm i express jsonwebtoken dotenv bcrypt
// npm i -D nodemon

require("dotenv").config();

const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

app.use(express.json());

const users = [];

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

let refreshTokens = [];

app.get("/posts", authenticateToken, (req, res) => {
  console.log(req.user);
  res.json(posts.filter((post) => post.username === req.user.name));
});

app.post("/login", (req, res) => {
  // Authenticate Users
  const username = req.body.username;
  const user = {
    name: username,
  };

  const accessToken = generateAccessToken(user);
  const refreshToken = generatRefreshToken(user);

  refreshTokens.push(refreshToken);

  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

const generateAccessToken = (user) => {
  //   ACCESS_TOKEN_SECRET: require('crypto').randomBytes(64).toString('hex')
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15s",
  });
};

const generatRefreshToken = (user) => {
  //   REFRESH_TOKEN_SECRET: require('crypto').randomBytes(64).toString('hex')
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
};

// Authenticate TOKEN middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  // Bearer _token
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Unauthorized access");
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
    if (error) {
      return res.status(403).send("Forbidden access");
    }
    req.user = user;
    next();
  });
}

// Generate access token using refresh token
app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.status(403).send("Invalid refresh token");
  }
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid refresh token");
    }
    const accessToken = generateAccessToken({ name: user.name });

    res.json({ accessToken: accessToken });
  });
});

// Gets called when user logs out
app.delete("/token", (req, res) => {
  const token = req.body.token;

  refreshTokens = refreshTokens.filter((t) => t !== token);

  res.status(200).send("Refresh Token Deleted");
});

// Starting from here is a different segment where we create and verify user which needs to be integrated with jwt
// Only for testing purposes
app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users/login", async (req, res) => {
  const user = users.find((user) => user.name === req.body.name);
  if (!user || !user.pwd || !req.body.pwd) {
    return res.status(400).send("No user found");
  }
  try {
    const verified = await bcrypt.compare(req.body.pwd, user.pwd);
    if (verified) {
      res.status(201).send("Logged in!");
    } else {
      res.status(201).send("Wrong username/password");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Something went wrong!");
  }
});

app.post("/users", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPwd = await bcrypt.hash(req.body.pwd, salt);

    const user = { name: req.body.name, pwd: hashedPwd };

    users.push(user);
    res.status(201).send();
  } catch (e) {
    res.status(500).send("Something went wrong!");
  }
});

app.listen(3000);
