const express = require("express");
const ObjectId = require("mongodb").ObjectId;
const { getStudentCollection, getFacultyCollection } = require("../../config/collections");

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const studentCollection = await getStudentCollection();
    const facultyCollection = await getFacultyCollection();

    if (!studentCollection || !facultyCollection) {
      return res.status(404).json({ message: "Collections not found" });
    }

    const students = await studentCollection.find({}).toArray();
    const faculties = await facultyCollection.find({}).toArray();

    const users = {
      students,
      faculties,
    };

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users." });
  }
});

router.delete("/delete-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const studentCollection = await getStudentCollection();
    const facultyCollection = await getFacultyCollection();

    if (!studentCollection || !facultyCollection) {
      return res.status(404).json({ message: "Collections not found" });
    }
    const query = { _id: new ObjectId(userId) };

    const studentDeleteResult = await studentCollection.deleteOne(query);

    if (studentDeleteResult.deletedCount > 0) {
      return res.status(200).json({
        message: `User with ID ${userId} deleted successfully from students.`,
      });
    }

    const facultyDeleteResult = await facultyCollection.deleteOne(query);

    if (facultyDeleteResult.deletedCount > 0) {
      return res.status(200).json({
        message: `User with ID ${userId} deleted successfully from faculties.`,
      });
    }

    // If the user was not found in either collection
    return res.status(404).json({
      message: `User with ID ${userId} not found in either students or faculties.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error); // Log the error
    res.status(500).json({ message: "Error deleting user." });
  }
});

module.exports = router;
