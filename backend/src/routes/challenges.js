// ── Challenge Routes ──────────────────────────────────────────────────────────
// GET  /api/challenges           — list all (search + filter + pagination)
// POST /api/challenges/analyse   — Gemini analysis without saving
// POST /api/challenges           — create a challenge
// GET  /api/challenges/:id       — single challenge with rooms

const express = require('express');
const router  = express.Router();
const { analyseChallenge } = require('../services/geminiService');

// ── GET /api/challenges ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { search, difficulty, tag, limit = 20, offset = 0 } = req.query;

  try {
    // Fetch all, filter in JS (SQLite has no full-text search)
    const all = await prisma.challenge.findMany({
      include: {
        creator: { select: { id: true, displayName: true } },
        rooms: {
          where: { status: { in: ['waiting', 'active'] } },
          select: { id: true, code: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let results = all;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c => c.title.toLowerCase().includes(q));
    }
    if (difficulty) {
      results = results.filter(c => c.difficulty === difficulty);
    }
    if (tag) {
      results = results.filter(c => {
        try { return JSON.parse(c.tags).includes(tag); }
        catch { return false; }
      });
    }

    const total     = results.length;
    const paginated = results.slice(Number(offset), Number(offset) + Number(limit));
    const formatted = paginated.map(c => ({ ...c, tags: safeJSON(c.tags, []) }));

    res.json({ total, challenges: formatted });
  } catch (err) {
    console.error('Fetch challenges error:', err);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// ── POST /api/challenges/analyse ─────────────────────────────────────────────
// Must be declared BEFORE /:id to avoid route collision
router.post('/analyse', async (req, res) => {
  const { title, problem } = req.body;
  if (!title || !problem)
    return res.status(400).json({ error: 'title and problem are required' });

  try {
    const analysis = await analyseChallenge(title, problem);
    res.json(analysis);
  } catch {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// ── POST /api/challenges ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const {
    title, problem, constraints, sampleInput, sampleOutput,
    difficulty, tags, creatorId,
  } = req.body;

  if (!title?.trim() || !problem?.trim() || !creatorId)
    return res.status(400).json({ error: 'title, problem and creatorId are required' });

  try {
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const finalDifficulty = ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)
      ? difficulty : 'Intermediate';
    const finalTags = Array.isArray(tags) ? tags : [];

    const challenge = await prisma.challenge.create({
      data: {
        title:       title.trim(),
        problem:     problem.trim(),
        constraints: constraints?.trim() || null,
        sampleInput: sampleInput?.trim() || null,
        sampleOutput:sampleOutput?.trim() || null,
        difficulty:  finalDifficulty,
        tags:        JSON.stringify(finalTags),
        creatorId,
      },
      include: { creator: { select: { id: true, displayName: true } } },
    });

    res.status(201).json({ ...challenge, tags: finalTags });
  } catch (err) {
    console.error('Create challenge error:', err);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// ── GET /api/challenges/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, displayName: true } },
        rooms: {
          where:   { status: { in: ['waiting', 'active'] } },
          include: {
            participants: {
              include: { user: { select: { id: true, displayName: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ ...challenge, tags: safeJSON(challenge.tags, []) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

function safeJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
