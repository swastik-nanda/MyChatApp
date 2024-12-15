const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/UserModel");

dotenv.config();

const mongoURL = process.env.MONGO_CONNECTION_STRING;
const jwtSecret = process.env.JWT_SECRET;
const frontendURL = process.env.CLIENT_URL; // Default to local if not set
const port = process.env.PORT; // Use PORT from .env or default to 4000

mongoose.connect(mongoURL);

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: frontendURL,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", frontendURL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

app.get("/test", (req, res) => {
  res.status(200).json("test ok");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    const createdUser = await User.create({ username, password });
    jwt.sign({ userId: createdUser._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).status(201).json({
        id: createdUser._id,
        username,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("error");
  }
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.status(200).json({
        userData,
      });
    });
  } else {
    res.status(401).json("No token");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
