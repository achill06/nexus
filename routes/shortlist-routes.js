const express = require('express');
const authMiddleware = require('../auth/auth-middleware');
const { addToShortlist, removeFromShortlist, getShortlist } = require('../tools/shortlist-db');

const router = express.Router();

router.post('/', authMiddleware, async (req, res, next) => {
  const { listingId, matchScore, justification } = req.body;
  if (!listingId || !Number.isInteger(listingId)) {
    return res.status(400).json({ message: 'listingId (integer) is required' });
  }
  try {
    const saved = await addToShortlist(req.userId, listingId, matchScore ?? null, justification ?? null);
    res.status(201).json({ shortlisted: saved });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Listing not found' });
    }
    next(error);
  }
});

router.delete('/:listingId', authMiddleware, async (req, res, next) => {
  const listingId = Number(req.params.listingId);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ message: 'listingId must be an integer' });
  }
  try {
    const removed = await removeFromShortlist(req.userId, listingId);
    if (!removed) {
      return res.status(404).json({ message: 'Listing was not on your shortlist' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const shortlist = await getShortlist(req.userId);
    res.json({ shortlist });
  } catch (error) {
    next(error);
  }
});

module.exports = router;