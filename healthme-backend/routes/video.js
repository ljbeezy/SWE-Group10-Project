const express = require('express');
const router = express.Router();
const { videoToken } = require('../controllers/videoController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/token', authMiddleware, videoToken);

module.exports = router;