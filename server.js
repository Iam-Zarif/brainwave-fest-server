const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const morgan = require("morgan");
const studentAuthroutes = require("./routes/studentAuth/studentAuth")
const studentProfileRoutes = require("./routes/profiles/studentProfile")
const facultyAuthroutes = require("./routes/facultyAuth/facultyAuth")
const studentFeedbackRoute = require("./routes/feedbacks/studentFeedback")
const adminAuthroutes = require("./routes/adminAuth/adminAuth")
const adminWatchUserListRoutes = require("./routes/AdminUserList/AdminUserList")
const courseManagementRoutes = require("./routes/CourseManagement/CourseManagement")

connectDB();
const app = express();
app.use(cookieParser());
app.use(morgan("dev"));

const corsOptions = {
  origin: "http://localhost:5173", // Frontend URL
  methods: "GET, POST, PUT, PATCH, DELETE",
  allowedHeaders: "Content-Type, Authorization", // Allow Authorization header for your API token
  credentials: true,  // Enable cookies to be sent with requests
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions)); // Apply CORS middleware


app.use(express.json());


// routes
app.use("/student-auth", studentAuthroutes)
app.use("/student-profile", studentProfileRoutes)
app.use("/faculty-auth", facultyAuthroutes)
app.use("/student-feedback", studentFeedbackRoute)
app.use("/admin-auth", adminAuthroutes)
app.use("/admin-watch", adminWatchUserListRoutes)
app.use("/course-management", courseManagementRoutes)



app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
