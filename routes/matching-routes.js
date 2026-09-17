const express = require('express');
const multer = require('multer');
const authMiddleware = require('../auth/auth-middleware');
const { processResumeUpload, getMatchesForUser } = require('../matching/match');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    cb(file.mimetype === 'application/pdf' ? null : new Error('Only PDF files are accepted'), true);
  },
});

function statusForError(message) {
  if (message.startsWith('pdf-parser:')) return 400;
  if (message === 'match: no resume on file for this user') return 404;
  if (message.startsWith('match: resume has not finished embedding')) return 409;
  return null;
}

function sendError(res, next, error) {
  const status = statusForError(error.message);
  if (status) return res.status(status).json({ message: error.message });
  next(error);
}

router.post('/resume', authMiddleware, upload.single('resume'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No resume file provided (field name: "resume")' });
  }
  try {
    const { resumeId } = await processResumeUpload(req.userId, req.file.buffer);
    res.status(201).json({ resumeId, message: 'Resume uploaded and embedded successfully' });
  } catch (error) {
    sendError(res, next, error);
  }
});

router.get('/matches', authMiddleware, async (req, res, next) => {
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    return res.status(400).json({ message: 'limit must be a positive integer' });
  }
  try {
    const matches = await getMatchesForUser(req.userId, Math.min(limit, 50));
    res.json({ matches });
  } catch (error) {
    sendError(res, next, error);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Resume PDF must be under 10MB' : err.message;
    return res.status(400).json({ message });
  }
  if (err && err.message === 'Only PDF files are accepted') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;