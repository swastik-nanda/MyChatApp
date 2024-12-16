const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/UserModel");

dotenv.config();

const mongoURL = process.env.MONGO_CONNECTION_STRING;
const jwtSecret = process.env.JWT_SECRET;
const frontendURL = process.env.CLIENT_URL; // Default to local if not set
const port = process.env.PORT; // Use PORT from .env or default to 4000

mongoose.connect(mongoURL);
const bcryptSalt = bcrypt.genSaltSync(10);
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
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json("error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const currentUser = await User.findOne({ username });
  if (currentUser) {
    const passOK = bcrypt.compareSync(password, currentUser.password);
    if (passOK) {
      jwt.sign(
        { userId: currentUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, { sameSite: "none", secure: true })
            .status(200)
            .json({
              id: currentUser._id,
            });
        }
      );
    }
  }
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      res.status(200).json({
        userId: decoded.userId,
        username: decoded.username,
      });
    });
  } else {
    res.status(401).json({ message: "No token provided" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});