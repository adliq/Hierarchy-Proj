// routes/fileRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const verifyToken = require('../middleware/auth');
const Idea = require('../models/Idea');
const nda = require('../models/nda');
const router = express.Router();

// /api/files/:ideaId/:filename
router.get('/:ideaId/:filename', verifyToken, async (req, res) => {
  const { ideaId, filename } = req.params;
  const userId = req.user.id;
  // Optional: get user email from token
  let userEmail = null;
  if (req.user.email) userEmail = req.user.email;
  // For classic login controller, you may want to fetch the email:
  // const user = await User.findById(userId);
  // userEmail = user?.email;

  // DEBUG LOG
  console.log('Attempting file access. userId:', userId, 'userEmail:', userEmail);

  // 1. Check if the idea exists
  const idea = await Idea.findById(ideaId);
  if (!idea) return res.status(404).send('Idea not found');

  // 2. NDA check: Always required per project rule
  if (!idea.nda) {
    return res.status(403).send('This idea is missing an NDA; access is not permitted.');
  }
  const ndaRecord = await nda.findOne({ idea: idea._id });
  if (!ndaRecord) {
    return res.status(403).send('NDA record not found. Access denied.');
  }

  // 3. NDA signed check (by userId or provided email)
  const isSigned = ndaRecord?.receivingParties?.some(
    (party) =>
      (party.userId && party.userId.toString() === userId) ||
      (
        party.email &&
        userEmail &&
        party.email.trim().toLowerCase() === userEmail.trim().toLowerCase()
      )
  );
  // Always allow creator
  const isCreator = idea.createdBy.toString() === userId;

  // Debug log
  console.log('NDA receivingParties:', ndaRecord?.receivingParties?.map(p => ({
    userId: p.userId?.toString(),
    email: p.email
  })));
  console.log('isSigned:', isSigned, 'isCreator:', isCreator);

  if (!isSigned && !isCreator) {
    return res.status(403).send(
      'You must sign the NDA for this idea to view attachments.'
    );
  }

  // 4. File streaming
  const filePath = path.join(__dirname, '../uploads', filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
const mimetype = mime.lookup(filePath) || 'application/octet-stream';
const inlineTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
];
if (inlineTypes.includes(mimetype)) {
  res.setHeader('Content-Type', mimetype);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  return res.sendFile(filePath, { headers: { 'Content-Type': mimetype } }, (err) => {
    if (err) {
      console.error('SendFile error:', err);
      res.status(500).send('File failed to send');
    }
  });
} else {
  return res.download(filePath, filename);
}

});

module.exports = router;
