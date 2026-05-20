// ── User Routes ───────────────────────────────────────────────────────────────
// POST /api/users      — create or update a user (keyed on clientId from localStorage)
// GET  /api/users/:id  — fetch user by ID

const express = require('express');
const router  = express.Router();

// POST /api/users
router.post('/', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { displayName, clientId } = req.body;

  if (!displayName?.trim()) return res.status(400).json({ error: 'displayName is required' });
  if (!clientId)            return res.status(400).json({ error: 'clientId is required' });

  try {
    // clientId (UUID from localStorage) is used as the stable primary key.
    // upsert: update displayName if user exists, create if not.
    const user = await prisma.user.upsert({
      where:  { id: clientId },
      update: { displayName: displayName.trim() },
      create: { id: clientId, displayName: displayName.trim() },
    });
    res.json(user);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;