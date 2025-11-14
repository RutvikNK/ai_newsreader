const express = require("express");
const { getStories } = require("../controllers/storiesController");
// const { getStories } = require("../controllers/storieswithHeygenApi.js");

const router = express.Router();

router.get("/", getStories);

module.exports = router;
