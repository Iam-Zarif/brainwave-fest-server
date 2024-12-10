const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOTP, sendOTP } = require("../../services/otpservice");
const { getStudentCollection } = require("../../config/collections");

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
router.get("/student/register/check-username", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim() === "") {
      console.log(`Checking username availability for: ${username}`);

      return res.status(400).json({
        available: false,
        message: "Username is required.",
      });
    }

    const studentCollection = await getStudentCollection();
    const existingUser = await studentCollection.findOne({ username });

    const isAvailable = !existingUser;

    res.status(200).json({
      available: isAvailable,
      message: isAvailable
        ? "Username is available."
        : "Username is already taken.",
    });
  } catch (error) {
    console.error("Error checking username availability:", error.message);
    res.status(500).json({ message: "Server error during username check." });
  }
});
router.post("/student/register/check-email", async (req, res) => {
  try {
    const { email } = req.body; // Extract email from the request body

    if (!email) {
      return res.status(400).json({
        available: false,
        message: "Email is required.",
      });
    }

    const studentCollection = await getStudentCollection();
    const emailExists = await studentCollection.findOne({ email });

    if (emailExists) {
      return res.status(200).json({
        available: false,
        message: "Email is already taken.",
      });
    }

    return res.status(200).json({
      available: true,
      message: "Email is available.",
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/student-register", limiter, async (req, res) => {
  try {
    const { fName, username, email, password, collegeRoll, profilePhoto } =
      req.body;

    if (
      !fName ||
      !username ||
      !email ||
      !password ||
      !collegeRoll ||
      !profilePhoto
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      fName,
      username,
      email,
      password: hashedPassword,
      collegeRoll,
      profilePhoto,
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
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/student-register-verify-otp", async (req, res) => {
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
    const studentCollection = await getStudentCollection();

    const newStudent = {
      _id: new mongoose.Types.ObjectId(),
      fName: storedData.fName,
      username: storedData.username,
      email: storedData.email,
      password: storedData.password,
      collegeRoll: storedData.collegeRoll,
      profilePhoto: storedData.profilePhoto || "",
      phone: storedData.phone || "",
      bloodGroup: storedData.bloodGroup || "",
      location: storedData.location || "",
      dateOfBirth: storedData.dateOfBirth || null,
      role: storedData.roll || "Student",
      cover: storedData.cover || "",
      bio: storedData.bio || "",
      skills: storedData.skills || [],
      certifications: storedData.certifications || [],
      department: storedData.department || "",
      session: storedData.session || "",
      registrationNumber: storedData.registrationNumber || "",
      results: storedData.results || [],
      interestedFields: storedData.interestedFields || [],
      notifications: storedData.notifications || [],
      attendance: [
        {
          month: "January",
          year: 2024,
          totalClasses: 12,
          attendedClasses: 10,
          attendancePercentage: 83.33,
          recentAttendance: [
            { date: "2024-01-01", status: "Present" },
            { date: "2024-01-02", status: "Present" },
            { date: "2024-01-03", status: "Present" },
            { date: "2024-01-04", status: "Present" },
            { date: "2024-01-05", status: "Absent" },
            { date: "2024-01-06", status: "Absent" },
            { date: "2024-01-07", status: "Absent" },
            { date: "2024-01-08", status: "Present" },
            { date: "2024-01-09", status: "Present" },
            { date: "2024-01-10", status: "Present" },
            { date: "2024-01-11", status: "Present" },
            { date: "2024-01-12", status: "Present" },
          ],
        },
      ],
    };

    const result = await studentCollection.insertOne(newStudent);
    otpStore.delete(email);

    // Generate JWT token for the registered user
    const token = jwt.sign(
      { id: result.insertedId, email: newStudent.email, role: newStudent.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in cookies
    res.cookie("token", token, {
      httpOnly: true, // Prevent client-side access to the cookie
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "Strict", // Adjust according to your CORS policy
    });

    res.status(201).json({
      message: "Student registration successful. Logged in successfully.",
      token,
      student: {
        id: result.insertedId,
        fName: newStudent.fName,
        username: newStudent.username,
        email: newStudent.email,
        role: newStudent.role,
      },
    });
  } catch (error) {
    console.error("Error storing student in DB:", error);
    res.status(500).json({ message: "Failed to save student data." });
  }
});

// Login Route
router.post("/student-login", limiter, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const studentCollection = await getStudentCollection();
    const student = await studentCollection.findOne({ email });
    console.log("login Student:", student);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const expiresIn = rememberMe ? "180d" : "24h";

    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.roll },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.cookie("token", token, {
      httpOnly: true, // Prevents client-side scripts from accessing the cookie
      secure: process.env.NODE_ENV === "production", // Use Secure flag in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "Strict", // Optional, depending on your use case
    });

    res.status(200).json({
      message: "Login successful.",
      token,
      student: {
        id: student._id,
        fName: student.fName,
        username: student.username,
        email: student.email,
        roll: student.roll,
        profilePhoto: student.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

router.post("/forgot-password/verify-email", limiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const studentCollection = await getStudentCollection();
    const student = await studentCollection.findOne({ email });

    if (!student) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist." });
    }

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60000, // OTP expires in 10 minutes
    });

    // Send OTP
    await sendOTP(email, otp);

    const maskedEmail = maskEmail(email);
    console.log(`OTP sent to: ${maskedEmail}`);
    res.status(201).json({
      message: "OTP sent successfully.",
      email: maskedEmail,
      otp: otp,
    });
  } catch (error) {
    console.error("Error verifying email and sending OTP:", error);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/forgot-password/reset-password", async (req, res) => {
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
      otpStore.delete(email);
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email); // Delete the expired OTP
      return res.status(400).json({ message: "OTP has expired." });
    }

    const studentCollection = await getStudentCollection();
    const student = await studentCollection.findOne({ email });

    if (!student) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, student.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the previous one.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await studentCollection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    otpStore.delete(email);

    // Generate JWT token for the user
    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "Strict",
    });

    res.status(200).json({
      message: "Password reset successfully. Logged in automatically.",
      token,
      student: {
        id: student._id,
        fName: student.fName,
        username: student.username,
        email: student.email,
        role: student.role,
      },
    });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ message: "Server error during password reset." });
  }
});
