const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/chat', authMiddleware, aiController.chatWithBot);
router.post('/analyze', authMiddleware, aiController.analyzeSymptoms);

module.exports = router;