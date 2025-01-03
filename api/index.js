const ws = require("ws");
const fs = require("fs");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/UserModel");
const Message = require("./models/Message");

dotenv.config();

const mongoURL = process.env.MONGO_CONNECTION_STRING;
const jwtSecret = process.env.JWT_SECRET;
const frontendURL = process.env.CLIENT_URL; // Default to local if not set
const port = process.env.PORT || 5000; // Use PORT from .env or default to 4000

mongoose.connect(mongoURL);
const bcryptSalt = bcrypt.genSaltSync(10);
const app = express();

app.use("/uploads", express.static(__dirname + "/uploads"));
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

async function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
        resolve(decoded);
      });
    } else {
      reject("no token");
    }
  });
}

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

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromReq(req);
  const ourUserId = userData.userId;
  const history = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });

  res.status(200).json({
    history,
  });
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

app.get("/people", async (req, res) => {
  const allUsers = await User.find({}, { _id: 1, username: 1 });
  res.status(200).json({
    users: allUsers,
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "", { sameSite: "none", secure: true }).status(200).json({
    message: "Logged out!",
  });
});

const server = app.listen(port);

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  function notifyAbtOnlineUsers() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAbtOnlineUsers();
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  // Read username and id from the cookie for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    try {
      const messageData = JSON.parse(message.toString());
      const { recipient, text, file } = messageData;
      let fileName = null;
      if (file) {
        const fileParts = file.name.split(".");
        const ext = fileParts[fileParts.length - 1];
        fileName = Date.now() + "." + ext;
        const path = __dirname + "/uploads/" + fileName;
        const content = new Buffer(file.data.split(",")[1], "base64");
        fs.writeFile(path, content, () => {
          console.log("file saved " + path);
        });
      }
      if (recipient && (text || file)) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient: recipient,
          text: text,
          file: file ? fileName : null,
        });
        console.log("Created message");
        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                text,
                file: file ? fileName : null,
                sender: connection.userId,
                recipient: recipient,
                _id: messageDoc._id,
              })
            )
          );
      }
    } catch (err) {
      console.error("Failed to process message:", err);
    }
  });

  // Notify about connected online users
  notifyAbtOnlineUsers();
});
