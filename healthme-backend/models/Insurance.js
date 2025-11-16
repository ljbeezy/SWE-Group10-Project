const mongoose = require('mongoose');

const InsuranceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyNumber: { type: String, required: true },
  provider: { type: String, required: true },
  coverageDetails: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insurance', InsuranceSchema);
