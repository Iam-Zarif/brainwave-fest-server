const express = require("express");
const { getAttendanceCollection } = require("../../config/collections");
const { ObjectId } = require("mongodb");

const router = express.Router();

// POST: Mark attendance for a class session (Faculty only)
router.post("/attendance", async (req, res) => {
  try {
    const { courseId, studentId, date, status } = req.body; // status: present/absent

    if (!courseId || !studentId || !date || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Verify user role (faculty)
    const { role, userId } = req.user; // Assuming user is added to req object by authentication middleware

    if (role !== "Faculty") {
      return res
        .status(403)
        .json({ message: "Only Faculty can mark attendance." });
    }

    const attendanceCollection = await getAttendanceCollection();
    if (!attendanceCollection) {
      return res
        .status(500)
        .json({ message: "Attendance collection not found." });
    }

    const newAttendanceRecord = {
      courseId: new ObjectId(courseId),
      studentId: new ObjectId(studentId),
      date: new Date(date),
      status,
      markedBy: new ObjectId(userId), // Faculty marking the attendance
      createdAt: new Date(),
    };

    const result = await attendanceCollection.insertOne(newAttendanceRecord);
    res
      .status(201)
      .json({
        message: "Attendance marked successfully",
        attendance: newAttendanceRecord,
      });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Error marking attendance." });
  }
});

// GET: View attendance of a specific student
router.get("/attendance/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify if the user is authorized to view this student's attendance
    const { role, userId } = req.user;

    if (role === "Student" && userId !== studentId) {
      return res
        .status(403)
        .json({ message: "You can only view your own attendance." });
    }

    const attendanceCollection = await getAttendanceCollection();
    if (!attendanceCollection) {
      return res
        .status(500)
        .json({ message: "Attendance collection not found." });
    }

    const attendanceRecords = await attendanceCollection
      .find({ studentId: new ObjectId(studentId) })
      .toArray();

    res.status(200).json({ attendance: attendanceRecords });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Error fetching attendance." });
  }
});

// GET: View all students' attendance for a specific course (Admin/Faculty only)
router.get("/attendance/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify user role (Admin or Faculty)
    const { role } = req.user;

    if (role !== "Admin" && role !== "Faculty") {
      return res
        .status(403)
        .json({ message: "Only Admin or Faculty can view course attendance." });
    }

    const attendanceCollection = await getAttendanceCollection();
    if (!attendanceCollection) {
      return res
        .status(500)
        .json({ message: "Attendance collection not found." });
    }

    const attendanceRecords = await attendanceCollection
      .find({ courseId: new ObjectId(courseId) })
      .toArray();

    res.status(200).json({ attendance: attendanceRecords });
  } catch (error) {
    console.error("Error fetching course attendance:", error);
    res.status(500).json({ message: "Error fetching course attendance." });
  }
});

// PUT: Update attendance (Admin only)
router.put("/attendance/:attendanceId", async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    // Verify user role (Admin only)
    const { role } = req.user;

    if (role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admin can update attendance." });
    }

    const attendanceCollection = await getAttendanceCollection();
    if (!attendanceCollection) {
      return res
        .status(500)
        .json({ message: "Attendance collection not found." });
    }

    const updatedAttendance = await attendanceCollection.updateOne(
      { _id: new ObjectId(attendanceId) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (updatedAttendance.modifiedCount === 0) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    res.status(200).json({ message: "Attendance updated successfully." });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Error updating attendance." });
  }
});

// DELETE: Delete attendance (Admin only)
router.delete("/attendance/:attendanceId", async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Verify user role (Admin only)
    const { role } = req.user;

    if (role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admin can delete attendance." });
    }

    const attendanceCollection = await getAttendanceCollection();
    if (!attendanceCollection) {
      return res
        .status(500)
        .json({ message: "Attendance collection not found." });
    }

    const deletedAttendance = await attendanceCollection.deleteOne({
      _id: new ObjectId(attendanceId),
    });

    if (deletedAttendance.deletedCount === 0) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    res
      .status(200)
      .json({ message: "Attendance record deleted successfully." });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ message: "Error deleting attendance." });
  }
});

module.exports = router;
