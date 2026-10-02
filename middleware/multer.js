const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ⚠️ Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

// Allow all images and these docs/archives
const allowedTypes = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
  // Plain text and more
  'text/plain',
];

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    allowedTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type! Only images and allowed documents are accepted.'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
