const mongoose = require('mongoose');

const DraftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  problem: String,
  solution: String,
  industry: String,
  goals: [String],
  custom: [{ label: String, text: String }],
  filePath: String, // or file info if you want
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Draft', DraftSchema);