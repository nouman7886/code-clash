# ⚡ Code Clash

A free, lightweight real-time coding competition platform. No sign-up, no Docker,
no paid services — just `npm install` and `npm run dev`.

## Features

- 🤖 **AI-powered** challenge analysis via Google Gemini
- ⚡ **Real-time** code sync, cursors, and typing indicators via Socket.IO
- 🏆 **Leaderboard** ranked by earliest submission time
- 🛠️ **Monaco Editor** with Java, Python, C++, JavaScript support
- 🎨 **Dark cyberpunk UI** with smooth animations
- 🔓 **No registration** — just pick a display name

## Quick Start

### 1. Clone and install
```bash
git clone <repo-url>
cd code-clash
npm run setup          # installs all deps + creates .env + pushes DB schema
```

### 2. Add your Gemini API key (free)
Get a free key from https://aistudio.google.com/app/apikey

```bash
# Edit backend/.env
GEMINI_API_KEY=your_key_here
```
> **Note:** The app works without a key — it just uses default difficulty/tags.

### 3. Run
```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend:  http://localhost:3001  
- DB Studio: `cd backend && npm run db:studio`

## Manual Setup (if `npm run setup` fails)

```bash
# Root
npm install

# Backend
cd backend
npm install
cp .env.example .env
# → edit .env and add GEMINI_API_KEY
npm run db:push        # creates dev.db (SQLite)

# Frontend
cd ../frontend
npm install

# Run both (from root)
cd ..
npm run dev
```

## Tech Stack

| Layer     | Tech                              |
|-----------|-----------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS    |
| Editor    | Monaco Editor (@monaco-editor/react) |
| Realtime  | Socket.IO (client + server)       |
| Backend   | Node.js + Express.js              |
| Database  | SQLite via Prisma ORM             |
| AI        | Google Gemini 1.5 Flash (free)    |

## How It Works

1. **Enter a display name** → stored in `localStorage`, synced to SQLite
2. **Browse or create challenges** → Gemini auto-suggests difficulty + tags
3. **Create a room** for a challenge (max 4 participants)
4. **Compete live** — see everyone's code, cursors, and typing in real time
5. **Submit** your solution → ranked by submission time on the leaderboard

## API Endpoints

```
POST   /api/users                    Create/upsert user
GET    /api/users/:id                Get user by ID

GET    /api/challenges               List challenges (search/filter)
POST   /api/challenges               Create challenge
GET    /api/challenges/:id           Get challenge + rooms
POST   /api/challenges/analyse       AI analysis (no save)

POST   /api/rooms                    Create room
GET    /api/rooms/:id                Get room details
POST   /api/rooms/:id/join           Join room
POST   /api/rooms/:id/start          Start competition
POST   /api/rooms/:id/end            End competition

POST   /api/submissions              Submit code
GET    /api/submissions/room/:id     Get room leaderboard
```

## Socket.IO Events

| Event (client→server) | Payload                          |
|-----------------------|----------------------------------|
| `join-room`           | `{ roomId, userId, displayName }`|
| `code-change`         | `{ roomId, userId, code }`       |
| `cursor-change`       | `{ roomId, userId, cursor }`     |
| `typing-status`       | `{ roomId, userId, isTyping }`   |
| `language-change`     | `{ roomId, userId, language }`   |

| Event (server→client) | Payload                          |
|-----------------------|----------------------------------|
| `room-state`          | Full room snapshot on join       |
| `user-joined`         | New participant connected         |
| `user-left`           | Participant disconnected          |
| `code-update`         | Another user's code changed      |
| `cursor-update`       | Another user's cursor moved      |
| `typing-update`       | Another user's typing status     |
| `language-update`     | Another user switched language   |
| `new-submission`      | Someone submitted code           |
| `room-started`        | Competition started               |
| `room-ended`          | Competition ended                 |