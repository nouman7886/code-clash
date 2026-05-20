// ── Room Routes ───────────────────────────────────────────────────────────────
// POST /api/rooms              — create room
// GET  /api/rooms/:id          — get room + participants + submissions
// POST /api/rooms/:id/join     — join room (max 4 participants)
// POST /api/rooms/:id/start    — start the competition
// POST /api/rooms/:id/end      — end the competition

const express = require('express');
const router  = express.Router();

// ── POST /api/rooms ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { challengeId, creatorId } = req.body;

  if (!challengeId || !creatorId)
    return res.status(400).json({ error: 'challengeId and creatorId are required' });

  try {
    const [challenge, user] = await Promise.all([
      prisma.challenge.findUnique({ where: { id: challengeId } }),
      prisma.user.findUnique({ where: { id: creatorId } }),
    ]);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!user)      return res.status(404).json({ error: 'User not found' });

    const room = await prisma.room.create({
      data: {
        challengeId,
        participants: { create: { userId: creatorId } },
      },
      include: roomInclude(),
    });

    res.status(201).json(formatRoom(room));
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// ── GET /api/rooms/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: roomInclude(),
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(formatRoom(room));
  } catch {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// ── POST /api/rooms/:id/join ──────────────────────────────────────────────────
router.post('/:id/join', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const room = await prisma.room.findUnique({
      where:   { id: req.params.id },
      include: { participants: true },
    });
    if (!room)                   return res.status(404).json({ error: 'Room not found' });
    if (room.status === 'ended') return res.status(400).json({ error: 'Competition has ended' });

    const alreadyIn = room.participants.some(p => p.userId === userId);
    if (!alreadyIn) {
      if (room.participants.length >= 4)
        return res.status(400).json({ error: 'Room is full (max 4 participants)' });
      await prisma.roomParticipant.create({ data: { roomId: room.id, userId } });
    }

    const updated = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: roomInclude(),
    });
    res.json(formatRoom(updated));
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// ── POST /api/rooms/:id/start ─────────────────────────────────────────────────
router.post('/:id/start', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io     = req.app.locals.io;
  try {
    const room = await prisma.room.update({
      where:  { id: req.params.id },
      data:   { status: 'active', startedAt: new Date() },
      include: roomInclude(),
    });
    io.to(req.params.id).emit('room-started', { startedAt: room.startedAt });
    res.json(formatRoom(room));
  } catch {
    res.status(500).json({ error: 'Failed to start room' });
  }
});

// ── POST /api/rooms/:id/end ───────────────────────────────────────────────────
router.post('/:id/end', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io     = req.app.locals.io;
  try {
    const room = await prisma.room.update({
      where:  { id: req.params.id },
      data:   { status: 'ended', endedAt: new Date() },
      include: roomInclude(),
    });
    io.to(req.params.id).emit('room-ended', { endedAt: room.endedAt });
    res.json(formatRoom(room));
  } catch {
    res.status(500).json({ error: 'Failed to end room' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function roomInclude() {
  return {
    challenge: {
      include: { creator: { select: { id: true, displayName: true } } },
    },
    participants: {
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { joinedAt: 'asc' },
    },
    submissions: {
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { submittedAt: 'asc' },
    },
  };
}

function formatRoom(room) {
  if (!room) return room;
  return {
    ...room,
    challenge: room.challenge
      ? { ...room.challenge, tags: safeJSON(room.challenge.tags, []) }
      : null,
  };
}

function safeJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;