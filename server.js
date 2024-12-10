const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const morgan = require("morgan");
const studentAuthroutes = require("./routes/studentAuth/studentAuth")
const studentProfileRoutes = require("./routes/profiles/studentProfile")

connectDB();
const app = express();
app.use(cookieParser());
app.use(morgan("dev"));

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());


// routes
app.use("/student-auth", studentAuthroutes)
app.use("/student-profile", studentProfileRoutes)

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
