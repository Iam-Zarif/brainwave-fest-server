


const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOTP, sendOTP } = require("../../services/otpservice");
const { getFacultyCollection } = require("../../config/collections");
const { default: mongoose } = require("mongoose");

dotenv.config();
const router = express.Router();

const otpStore = new Map();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many registrations from this IP, please try again later.",
});

function maskEmail(email) {
  const [localPart, domain] = email.split("@");
  const maskedLocalPart = localPart.slice(0, 3) + "****";
  return maskedLocalPart + "@" + domain;
}


// Faculty Registration Route
router.post("/faculty-register", limiter, async (req, res) => {
  try {
    const { facultyName, email, password, facultyId, photo } = req.body;

    if (!facultyName || !email || !password || !facultyId || !photo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      facultyName,
      email,
      password: hashedPassword,
      facultyId,
      photo,
      expiresAt: Date.now() + 10 * 60000, // OTP expires in 10 minutes
    });

    await sendOTP(email, otp);
    const maskedEmail = maskEmail(email);

    res.status(201).json({
      message: "OTP sent for registration",
      otp,
      email: maskedEmail,
    });
  } catch (error) {
    console.error("Faculty Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/faculty-register-verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const storedData = otpStore.get(email);

  if (!storedData) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  if (storedData.otp !== otp) {
    otpStore.delete(email);
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  try {
    const facultyCollection = await getFacultyCollection();

   const newFaculty = {
     email: storedData.email || "",
     members: storedData.members || [],
     password: storedData.password || "",
     phone: storedData.phone || "",
     profilePhoto: storedData.profilePhoto || "",
     slogan: storedData.slogan || "",
     publications: storedData.publications || [],
     notifications: storedData.notifications || [],
     joiningDate: storedData.joiningDate || Date.now(),
     facultyName: storedData.facultyName || "",
     facultyId: storedData.facultyId || "",
     department: storedData.department || "",
     students: storedData.students || [],
     totalStudents: storedData.totalStudents || 0,
     role: "Faculty",
   };


    await facultyCollection.insertOne(newFaculty);
    otpStore.delete(email);

    res.status(201).json({
      message: "Faculty registration successful",
      faculty: newFaculty,
    });
  } catch (error) {
    console.error("Error storing faculty in DB:", error);
    res.status(500).json({ message: "Failed to save faculty data." });
  }
});

router.post("/faculty-login", limiter, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const facultyCollection = await getFacultyCollection();
    const faculty = await facultyCollection.findOne({ email });
    console.log("Login Faculty:", faculty);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, faculty.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const expiresIn = rememberMe ? "180d" : "24h";

    const token = jwt.sign(
      { id: faculty._id, email: faculty.email, role: faculty.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: rememberMe ? 180 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      message: "Login successful.",
      token,
      faculty: {
        id: faculty._id,
        facultyName: faculty.facultyName,
        email: faculty.email,
        facultyId: faculty.facultyId,
        photo: faculty.photo,
      },
    });
  } catch (error) {
    console.error("Error during faculty login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});
// Faculty Password Reset - Request OTP
router.post("/faculty-forgot-password/verify-email", limiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const facultyCollection = await getFacultyCollection();
    const faculty = await facultyCollection.findOne({ email });

    if (!faculty) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist." });
    }

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60000, // OTP expires in 10 minutes
    });

    await sendOTP(email, otp);

    const maskedEmail = maskEmail(email);
    console.log(`OTP sent to: ${maskedEmail}`);
    res.status(201).json({
      message: "OTP sent successfully.",
      email: maskedEmail,
      otp: otp, // Remove this in production for security
    });
  } catch (error) {
    console.error("Error verifying email and sending OTP:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Faculty Password Reset - Reset Password
router.post("/faculty-forgot-password/set-new-password", async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;

    if (!email || !newPassword || !otp) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required.",
      });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (storedData.otp !== otp) {
      otpStore.delete(email); // Clear OTP on invalid attempt
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email); // Clear expired OTP
      return res.status(400).json({ message: "OTP has expired." });
    }

    const facultyCollection = await getFacultyCollection();
    const faculty = await facultyCollection.findOne({ email });

    if (!faculty) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, faculty.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the previous one.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await facultyCollection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    otpStore.delete(email); // Clear OTP after successful reset

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error during password reset." });
  }
});


module.exports = router;