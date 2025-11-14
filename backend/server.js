const express = require("express");
const cors = require("cors");
const storiesRouter = require("./routes/stories.js");
require("dotenv").config;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/stories", storiesRouter);

const PORT = 8080;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// // middleware
// function logger(req, res, next) {
//   console.log("Before");
//   next();
//   console.log("After");
// }

// function auth(req, res, next) {
//   if (req.query.admin === "true") {
//     req.admin = true;
//     next();
//   } else {
//     res.send("NO AUTH");
//   }
// }

// app.listen(3000);
