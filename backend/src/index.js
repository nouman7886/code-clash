// ── Code Clash — Backend Entry Point ─────────────────────────────────────────
require('dotenv').config();

const { execFileSync } = require('child_process');
const path          = require('path');
const express      = require('express');
const { createServer } = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const { PrismaClient } = require('@prisma/client');

// Routes
const userRoutes       = require('./routes/users');
const challengeRoutes  = require('./routes/challenges');
const roomRoutes       = require('./routes/rooms');
const submissionRoutes = require('./routes/submissions');
const executeRoutes = require("./routes/execute");

// Real-time setup
const setupSocket = require('./socket');

function ensureDatabase() {
  if (process.env.SKIP_PRISMA_PUSH === 'true') return;

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  execFileSync(npx, ['prisma', 'db', 'push', '--skip-generate'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
}

ensureDatabase();

const normalizeOrigin = value => {
  if (!value) return '';

  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  return withProtocol.replace(/\/+$/, '');
};

const frontendOrigin = normalizeOrigin(
  process.env.FRONTEND_URL || 'https://code-clash-self.vercel.app'
);

const allowedOrigins = new Set([
  frontendOrigin,
  'https://code-clash-self.vercel.app',
  'http://localhost:5173',
]);

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

// ── App & HTTP server ─────────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);
const prisma     = new PrismaClient();

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));  // code submissions can be large

// Share prisma + io with route handlers
app.locals.prisma = prisma;
app.locals.io     = io;

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use('/api/users',       userRoutes);
app.use('/api/challenges',  challengeRoutes);
app.use("/api/execute", executeRoutes);
app.use('/api/rooms',       roomRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
setupSocket(io, prisma);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀  Code Clash backend  →  https://code-clash-jkdd.onrender.com`);
  console.log(`📡  Socket.IO ready for real-time connections`);
  console.log(`🗄️   Database: ${process.env.DATABASE_URL}\n`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
