const mongoose = require('mongoose');

// Schema for a single file attachment
const attachmentSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  path: String,        // <-- changed from url to path
}, { _id: false });

// Define the schema for an Idea
const ideaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100 // keep titles short and clear
  },
  summary: {
    type: String,
    required: true,
    maxlength: 350 // summary shown to everyone
  },
  details: {
    type: String,
    required: true // full details protected by NDA
  },
  category: {
    type: String,
    required: true
  },
  tags: [String], // helpful for search and filtering
  visibility: {
    type: String,
    enum: ['allIndustries', 'industry'],
    required: true
  },
  visibleToIndustries: [String], // if visibility is 'industry'
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nda'
  },
  attachments: [attachmentSchema], // <<--- All uploaded files for this idea
}, { timestamps: true });

// Enable text search on title and summary
ideaSchema.index({ title: "text", summary: "text" });

module.exports = mongoose.model('Idea', ideaSchema);
