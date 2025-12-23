const express = require("express");
const router = express.Router();
const runController = require("../controllers/runController");

// Use the controller which now implements the Piston API (Free/Unlimited)
router.post("/", runController.runCode);

module.exports = router;
