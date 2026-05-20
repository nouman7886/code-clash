// ── Submission Routes ─────────────────────────────────────────────────────────
// POST /api/submissions              — submit code for a room
// GET  /api/submissions/room/:roomId — leaderboard (ranked by time)

const express = require('express');
const router  = express.Router();

const VALID_LANGUAGES = ['java', 'python', 'cpp', 'javascript'];

// ── POST /api/submissions ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io     = req.app.locals.io;
  const { roomId, userId, code, language } = req.body;

  if (!roomId || !userId || !code || !language)
    return res.status(400).json({ error: 'roomId, userId, code and language are required' });

  if (!VALID_LANGUAGES.includes(language))
    return res.status(400).json({ error: `language must be one of: ${VALID_LANGUAGES.join(', ')}` });

  try {
    const room = await prisma.room.findUnique({
      where:   { id: roomId },
      include: { participants: true },
    });
    if (!room)                   return res.status(404).json({ error: 'Room not found' });
    if (room.status === 'ended') return res.status(400).json({ error: 'Competition has ended' });

    const isParticipant = room.participants.some(p => p.userId === userId);
    if (!isParticipant)
      return res.status(403).json({ error: 'You are not a participant in this room' });

    // One submission per user
    const existing = await prisma.submission.findFirst({ where: { roomId, userId } });
    if (existing) return res.status(400).json({ error: 'You have already submitted' });

    const submission = await prisma.submission.create({
      data:    { roomId, userId, code, language },
      include: { user: { select: { id: true, displayName: true } } },
    });

    // Broadcast to room so the leaderboard updates live
    io.to(roomId).emit('new-submission', {
      submission: {
        id:          submission.id,
        userId:      submission.userId,
        displayName: submission.user.displayName,
        language:    submission.language,
        submittedAt: submission.submittedAt,
      },
    });

    res.status(201).json(submission);
  } catch (err) {
    console.error('Submit code error:', err);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

// ── GET /api/submissions/room/:roomId ─────────────────────────────────────────
// Earliest submission = rank 1
router.get('/room/:roomId', async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const submissions = await prisma.submission.findMany({
      where:   { roomId: req.params.roomId },
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { submittedAt: 'asc' },
    });
    const ranked = submissions.map((s, i) => ({
      ...s,
      displayName: s.user.displayName,
      rank: i + 1,
    }));
    res.json(ranked);
  } catch {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

module.exports = router;