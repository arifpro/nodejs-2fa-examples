const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Enable CORS for all requests
app.use(cors());

// Serve static files (QR codes) from the 'public' folder inside the 'google-authenticator' folder
app.use("/public", express.static(path.join(__dirname, "public")));

// Serve index.html when accessing the root route '/'
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Initialize SQLite Database
const db = new sqlite3.Database(
  "./src/google-authenticator/users.db",
  (err) => {
    if (err) console.error("Database connection error:", err.message);
    console.log("Connected to SQLite database.");
  }
);

// Create Users Table
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    secret TEXT
  )`
);

// 🆕 **1. Register User and Save QR Code Image**
app.post("/register", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });

  // Generate Secret for TOTP
  const secret = speakeasy.generateSecret({
    length: 20,
    name: "CustomProjectName",
  });

  // Store user and secret in SQLite
  db.run(
    "INSERT INTO users (username, secret) VALUES (?, ?)",
    [username, secret.base32],
    (err) => {
      if (err) return res.status(500).json({ error: "User already exists" });

      // Generate QR Code and save to the 'public' directory
      const qrCodePath = path.join(
        __dirname,
        "public",
        `${username}-qrcode.png`
      );
      qrcode.toFile(qrCodePath, secret.otpauth_url, (err) => {
        if (err) return res.status(500).json({ error: "Error saving QR Code" });

        // Return local URL for QR code
        const qrCodeUrl = `/public/${username}-qrcode.png`;
        res.json({
          message: "User registered",
          secret: secret.base32,
          qrCodeUrl,
        });
      });
    }
  );
});

// 🔑 **2. Verify OTP**
app.post("/verify", (req, res) => {
  const { username, token } = req.body;
  if (!username || !token)
    return res.status(400).json({ error: "Username and token required" });

  // Retrieve user's secret from SQLite
  db.get(
    "SELECT secret FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err || !row) return res.status(404).json({ error: "User not found" });

      // Verify OTP
      const verified = speakeasy.totp.verify({
        secret: row.secret,
        encoding: "base32",
        token,
        window: 1,
      });

      res.json({ verified });
    }
  );
});

// 🧑‍💻 **3. Get User's Secret (For Debugging)**
app.get("/user/:username", (req, res) => {
  const { username } = req.params;

  db.get(
    "SELECT secret FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err || !row) return res.status(404).json({ error: "User not found" });

      res.json({ username, secret: row.secret });
    }
  );
});

// 🚀 Start Server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
