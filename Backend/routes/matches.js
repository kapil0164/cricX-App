const express = require('express');
const Match   = require('../models/Match');
const router  = express.Router();

// ── GET all matches (sorted newest first) ──────────────
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET single match by id ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST create new match ──────────────────────────────
// Returns the full saved document including _id
router.post('/', async (req, res) => {
  try {
    const match = await Match.create(req.body);
    res.status(201).json(match); // ✅ return full doc so React can store _id
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT update existing match (called after every ball) ─
router.put('/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // ✅ return updated doc
    );
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE a match ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json({ message: 'Match deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;