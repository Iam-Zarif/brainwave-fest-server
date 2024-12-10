const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");


const app = express();
app.use(cookieParser());

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
