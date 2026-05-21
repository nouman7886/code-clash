const express = require('express');
const router = express.Router();

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

router.post('/', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { challengeId, creatorId } = req.body;

  if (!challengeId || !creatorId) {
    return res.status(400).json({ error: 'challengeId and creatorId are required' });
  }

  try {
    const [challenge, user] = await Promise.all([
      prisma.challenge.findUnique({ where: { id: challengeId } }),
      prisma.user.findUnique({ where: { id: creatorId } }),
    ]);

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const room = await prisma.room.create({
      data: {
        challengeId,
        code: await generateUniqueRoomCode(prisma),
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

router.get('/stats', async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const liveRooms = await prisma.room.findMany({
      where: { status: { in: ['waiting', 'active'] } },
      include: { participants: true },
    });

    res.json({
      rooms: liveRooms.length,
      players: liveRooms.reduce((sum, room) => sum + room.participants.length, 0),
    });
  } catch (err) {
    console.error('Room stats error:', err);
    res.status(500).json({ error: 'Failed to fetch room stats' });
  }
});

router.get('/lookup/:code', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const code = normalizeRoomCode(req.params.code);

  if (!code) return res.status(400).json({ error: 'Room ID is required' });

  try {
    const room = await findRoomByCodeOrId(prisma, code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(formatRoom(room));
  } catch (err) {
    console.error('Room lookup error:', err);
    res.status(500).json({ error: 'Failed to find room' });
  }
});

router.get('/:id', async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const room = await findRoomByCodeOrId(prisma, req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(formatRoom(room));
  } catch (err) {
    console.error('Fetch room error:', err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.post('/:id/join', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const room = await findRoomByCodeOrId(prisma, req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const alreadyIn = room.participants.some(p => p.userId === userId);
    if (room.status === 'ended' && !alreadyIn) {
      return res.status(400).json({ error: 'Competition has ended' });
    }

    if (!alreadyIn) {
      if (room.participants.length >= 4) {
        return res.status(400).json({ error: 'Room is full (max 4 participants)' });
      }

      await prisma.roomParticipant.create({ data: { roomId: room.id, userId } });
    }

    const updated = await prisma.room.findUnique({
      where: { id: room.id },
      include: roomInclude(),
    });

    res.json(formatRoom(updated));
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

router.post('/:id/start', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;

  try {
    const existing = await findRoomByCodeOrId(prisma, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Room not found' });

    const room = await prisma.room.update({
      where: { id: existing.id },
      data: { status: 'active', startedAt: new Date() },
      include: roomInclude(),
    });

    io.to(room.id).emit('room-started', { startedAt: room.startedAt });
    res.json(formatRoom(room));
  } catch (err) {
    console.error('Start room error:', err);
    res.status(500).json({ error: 'Failed to start room' });
  }
});

router.post('/:id/end', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;

  try {
    const existing = await findRoomByCodeOrId(prisma, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Room not found' });

    const room = await prisma.room.update({
      where: { id: existing.id },
      data: { status: 'ended', endedAt: new Date() },
      include: roomInclude(),
    });

    io.to(room.id).emit('room-ended', { endedAt: room.endedAt });
    res.json(formatRoom(room));
  } catch (err) {
    console.error('End room error:', err);
    res.status(500).json({ error: 'Failed to end room' });
  }
});

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
    code: room.code || fallbackCode(room.id),
    challenge: room.challenge
      ? { ...room.challenge, tags: safeJSON(room.challenge.tags, []) }
      : null,
  };
}

function safeJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function normalizeRoomCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function fallbackCode(id) {
  return normalizeRoomCode(id).slice(-ROOM_CODE_LENGTH);
}

function createRoomCode() {
  let code = '';

  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }

  return code;
}

async function generateUniqueRoomCode(prisma) {
  for (let attempts = 0; attempts < 12; attempts += 1) {
    const code = createRoomCode();
    const existing = await prisma.room.findFirst({ where: { code } });
    if (!existing) return code;
  }

  throw new Error('Unable to generate a unique room code');
}

async function findRoomByCodeOrId(prisma, value) {
  const normalized = normalizeRoomCode(value);

  const room = await prisma.room.findFirst({
    where: {
      OR: [
        { id: value },
        { code: normalized },
      ],
    },
    include: roomInclude(),
  });

  if (room || normalized.length !== ROOM_CODE_LENGTH) return room;

  const legacyRooms = await prisma.room.findMany({
    where: { code: null },
    include: roomInclude(),
  });

  return legacyRooms.find(legacyRoom => fallbackCode(legacyRoom.id) === normalized) || null;
}

module.exports = router;
