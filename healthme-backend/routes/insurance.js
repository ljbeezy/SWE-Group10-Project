const express = require('express');
const insuranceRouter = express.Router();
const authMiddleware = require('../middleware/auth');
const Insurance = require('../models/Insurance');

// POST /api/insurance/add
insuranceRouter.post('/add', authMiddleware, async (req, res) => {
  const { policyNumber, provider, coverageDetails } = req.body;
  try {
    const insurance = new Insurance({ userId: req.user.id, policyNumber, provider, coverageDetails });
    await insurance.save();
    res.json({ message: 'Insurance added' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/insurance
insuranceRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const insurance = await Insurance.find({ userId: req.user.id });
    res.json(insurance);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = insuranceRouter;
