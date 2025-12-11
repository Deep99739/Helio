const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');

router.get('/:roomId', logsController.getLogs);

module.exports = router;
