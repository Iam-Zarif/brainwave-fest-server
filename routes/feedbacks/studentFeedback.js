const express = require("express");
const { getStudentFeedbackCollection } = require("../../config/collections");

const router = express.Router();

router.get("/student-feedback", async (req, res) => {
  try {
    const feedbackCollection = await getStudentFeedbackCollection();
    const feedbacks = await feedbackCollection.find().toArray();

    if (!feedbacks.length) {
      return res.status(404).json({ message: "No feedback found." });
    }

    res.status(200).json({
      message: "Feedbacks fetched successfully.",
      feedbacks,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch feedbacks.", error: error.message });
  }
});

module.exports = router;
