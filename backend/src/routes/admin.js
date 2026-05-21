const crypto = require('crypto');
const express = require('express');
const router = express.Router();

const DEFAULT_ADMIN_USERNAME = 'Mani6778';
const DEFAULT_PASSWORD_HASH = '0f24d235e76756c3fa24c6fe0870358cb259bbf1ad3d94d6f3e22cc6b8c41a98';

function adminUsername() {
  return process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
}

function adminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
}

function tokenSecret() {
  return process.env.ADMIN_TOKEN_SECRET || adminPasswordHash();
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  try {
    if (!token || !token.includes('.')) return null;

    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', tokenSecret()).update(body).digest('base64url');

    if (Buffer.byteLength(sig) !== Buffer.byteLength(expected)) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const payload = verify(token);

  if (!payload || payload.username !== adminUsername()) {
    return res.status(401).json({ error: 'Admin login required' });
  }

  next();
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username !== adminUsername() || hash(password || '') !== adminPasswordHash()) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  res.json({
    token: sign({
      username,
      exp: Date.now() + 1000 * 60 * 60 * 6,
    }),
  });
});

router.get('/rooms', requireAdmin, async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const rooms = await prisma.room.findMany({
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
        participants: {
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        submissions: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      rooms: rooms.map(room => ({
        id: room.id,
        status: room.status,
        createdAt: room.createdAt,
        startedAt: room.startedAt,
        endedAt: room.endedAt,
        challenge: room.challenge,
        participants: room.participants.map(p => ({
          userId: p.userId,
          displayName: p.user.displayName,
        })),
        submissionCount: room.submissions.length,
      })),
    });
  } catch (err) {
    console.error('Admin rooms error:', err);
    res.status(500).json({ error: 'Failed to load rooms' });
  }
});

router.delete('/rooms/:id', requireAdmin, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const { id } = req.params;

  try {
    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { roomId: id } }),
      prisma.roomParticipant.deleteMany({ where: { roomId: id } }),
      prisma.room.delete({ where: { id } }),
    ]);

    io.to(id).emit('room-deleted');
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete room error:', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
