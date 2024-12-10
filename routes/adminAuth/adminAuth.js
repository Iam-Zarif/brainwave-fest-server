const express = require("express");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const router = express.Router();

// In-memory OTP storage (use a proper database in production)
const otpStore = new Map();

// Rate limiter for login requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per IP
  message: "Too many login attempts. Please try again later.",
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

// Helper function to generate an OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
}

// Helper function to generate JWT token
function generateToken(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Token expiration time
  });
}

// POST: Admin Login
router.post("/admin-login", limiter, async (req, res) => {
  try {
    const { password } = req.body;

    const fixedEmail = "mostofafatin19@gmail.com";

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    // Check for the fixed password
    if (password !== "12345") {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate OTP and store it
    const otp = generateOTP();
    otpStore.set(fixedEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60000, // OTP expires in 10 minutes
    });

    // Send OTP to the fixed admin email
    await transporter.sendMail({
      from: `"Admin Support" <${process.env.EMAIL_USER}>`,
      to: fixedEmail,
      subject: "Your OTP for Admin Login",
      text: `Your OTP is ${otp}. This OTP will expire in 10 minutes.`,
    });

    res.status(200).json({
      message: "OTP has been sent to the admin email address.",
      otp: otp, // Do not send this in production, remove for security
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// POST: Verify OTP
router.post("/admin-login/verify-otp", async (req, res) => {
  try {
    const { otp } = req.body;

    const fixedEmail = "mostofafatin19@gmail.com";

    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    const storedOTP = otpStore.get(fixedEmail);

    if (!storedOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (storedOTP.otp.toString() !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(fixedEmail);
      return res.status(400).json({ message: "OTP has expired." });
    }

    // OTP is valid, clear it from the store
    otpStore.delete(fixedEmail);

    // Generate JWT token
    const token = generateToken(fixedEmail);

    res.status(200).json({
      message: "Login successful!",
      token: token, // Return the JWT token
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
});

module.exports = router;
