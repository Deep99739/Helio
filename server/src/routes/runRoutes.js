const express = require("express");
const router = express.Router();
const runController = require("../controllers/runController");

// piston api instead of jdoodle 
router.post("/", runController.runCode);

module.exports = router;
