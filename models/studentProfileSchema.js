const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
    },
    collegeRoll: {
      type: String,
      unique: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: "default.jpg", // Default profile image path
    },
    coverPhoto: {
      type: String,
      default: "default-cover.jpg", // Default cover image path
    },
    phone: {
      type: String,
      match: [/^\d{10,15}$/, "Invalid phone number"],
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    role: {
      type: String,
      required: true,
      enum: ["Student"], // Enforcing specific roles for this schema
    },
    bio: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    session: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    results: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        grade: { type: String, trim: true },
        semester: { type: String, trim: true },
      },
    ],
    interestedFields: {
      type: [String],
      default: [],
    },
    notifications: [
      {
        message: { type: String },
        isRead: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
      },
    ],
    attendance: [
      {
        month: { type: String, required: true }, // e.g., "January"
        year: { type: Number, required: true }, // e.g., 2024
        totalClasses: { type: Number, required: true },
        attendedClasses: { type: Number, required: true },
        attendancePercentage: { type: Number, required: true },
        recentAttendance: [
          {
            date: { type: Date, required: true },
            status: {
              type: String,
              enum: ["Present", "Absent"],
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
    collection: "students",
  }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

module.exports = StudentProfile;
