const express = require("express");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection URI
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/google-authenticator";

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Database connection error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  secret: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

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

// 🆕 **1. Register User and Save QR Code Image**
app.post("/register", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });

  try {
    // Generate Secret for TOTP
    const secret = speakeasy.generateSecret({
      length: 20,
      name: "CustomProjectName",
    });

    // Store user and secret in MongoDB
    const user = new User({
      username,
      secret: secret.base32,
    });

    await user.save();

    // Generate QR Code and save to the 'public' directory
    const qrCodePath = path.join(__dirname, "public", `${username}-qrcode.png`);
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
  } catch (err) {
    res.status(500).json({ error: "User registration failed" });
  }
});

// 🔑 **2. Verify OTP**
app.post("/verify", async (req, res) => {
  const { username, token } = req.body;
  if (!username || !token)
    return res.status(400).json({ error: "Username and token required" });

  try {
    // Retrieve user's secret from MongoDB
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify OTP
    const verified = speakeasy.totp.verify({
      secret: user.secret,
      encoding: "base32",
      token,
      window: 1,
    });

    res.json({ verified });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// 🧑‍💻 **3. Get User's Secret (For Debugging)**
app.get("/user/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ username, secret: user.secret });
  } catch (err) {
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
