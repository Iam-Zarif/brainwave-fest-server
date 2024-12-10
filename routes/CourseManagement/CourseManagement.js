const express = require("express");
const { getCoursesCollection } = require("../../config/collections");
const ObjectId = require("mongodb").ObjectId;
const router = express.Router();

const checkAdminRole = (req, res, next) => {
  const userRole = req.user?.role; 
  if (userRole === "Student") {
    return res
      .status(403)
      .json({ message: "Students are not allowed to modify courses." });
  }
  next();
};

router.post("/courses", checkAdminRole, async (req, res) => {
  try {
    const {
      courseName,
      department,
      description,
      credits,
      creditsDetails,
      courseCode,
      facultyAssigned,
      semester,
      schedule,
      availableSeats,
      classTimes,
    } = req.body;

    // Validate required fields
    const coursesCollection = await getCoursesCollection();

    if (!coursesCollection) {
      return res.status(500).json({ message: "Courses collection not found." });
    }

    const newCourse = {
      courseName,
      department,
      description,
      credits,
      creditsDetails,
      courseCode,
      facultyAssigned: new ObjectId(facultyAssigned), // Convert facultyAssigned to ObjectId
      semester,
      schedule,
      availableSeats,
      classTimes,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "Active", // Default course status
    };

    const result = await coursesCollection.insertOne(newCourse);

    res.status(201).json({
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course." });
  }
});

// PUT: Update an existing course
router.put("/courses/:courseId", checkAdminRole, async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      courseName,
      department,
      description,
      credits,
      creditsDetails,
      facultyAssigned,
      semester,
      schedule,
      availableSeats,
      classTimes,
      status,
    } = req.body;

    // Validate required fields
    if (
      !courseName ||
      !department ||
      !description ||
      !credits ||
      !creditsDetails ||
      !facultyAssigned ||
      !semester ||
      !schedule ||
      availableSeats === undefined ||
      !classTimes ||
      !status
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const coursesCollection = await getCoursesCollection();

    if (!coursesCollection) {
      return res.status(500).json({ message: "Courses collection not found." });
    }

    const updatedCourse = {
      courseName,
      department,
      description,
      credits,
      creditsDetails,
      facultyAssigned: new ObjectId(facultyAssigned), // Convert facultyAssigned to ObjectId
      semester,
      schedule,
      availableSeats,
      classTimes,
      updatedAt: new Date(),
      status,
    };

    // Update the course in the database
    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updatedCourse }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course." });
  }
});

// DELETE: Delete a course
router.delete("/courses/:courseId", checkAdminRole, async (req, res) => {
  try {
    const { courseId } = req.params;

    const coursesCollection = await getCoursesCollection();

    if (!coursesCollection) {
      return res.status(500).json({ message: "Courses collection not found." });
    }

    const result = await coursesCollection.deleteOne({
      _id: new ObjectId(courseId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course." });
  }
});

module.exports = router;
