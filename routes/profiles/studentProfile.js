const express = require("express");
const { getStudentCollection } = require("../../config/collections");
const jwt = require("jsonwebtoken");

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.student = decoded; // Set the decoded user to the request object
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

router.get("/student-profile", authenticateToken, async (req, res) => {
  try {
    const StudentProfile = await getStudentCollection();

    const student = await StudentProfile.findOne({
      email: req?.student?.email,
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const { password, ...profileWithoutPassword } = student; // Remove password
    res.status(200).json({
      message: "Student profile fetched successfully.",
      profile: profileWithoutPassword, // Return profile without password
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Failed to retrieve profile." });
  }
});

router.put("/update-profile", authenticateToken, async (req, res) => {
  const {
    fName,
    username,
    email,
    phone,
    bloodGroup,
    location,
    dateOfBirth,
    bio,
    skills,
    certifications,
    department,
    session,
    registrationNumber,
    profilePhoto,
    coverPhoto,
  } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ message: "Email required." });
  }

  try {
    const StudentProfile = await getStudentCollection();

    // Find student by email
    const student = await StudentProfile.findOne({ email: req.student.email });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Ensure that the student trying to update is the same as the one in the token
    if (student.email !== req.student.email) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this profile." });
    }

    // Prepare the fields to update
    const updatedFields = {
      fName,
      username,
      phone,
      bloodGroup,
      location,
      dateOfBirth,
      bio,
      skills,
      certifications,
      department,
      session,
      registrationNumber,
      profilePhoto,
      coverPhoto,
    };

    // Use $set to update only the provided fields
    const updateObject = {};
    Object.keys(updatedFields).forEach((key) => {
      if (updatedFields[key]) {
        updateObject[key] = updatedFields[key];
      }
    });

    // Update the student profile
    const updatedStudent = await StudentProfile.findOneAndUpdate(
      { email: req.student.email }, // Find the student by email
      { $set: updateObject }, // Update the fields
      { new: true } // Return the updated document
    );

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ message: "Failed to update student profile." });
    }

    res.status(200).json({
      message: "Student profile updated successfully.",
      profile: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Failed to update student profile." });
  }
});

module.exports = router;
