// ── Socket.IO Real-time Handler ───────────────────────────────────────────────
//
// Client → Server events:
//   join-room       { roomId, userId, displayName }
//   code-change     { roomId, userId, code }
//   cursor-change   { roomId, userId, cursor }
//   typing-status   { roomId, userId, isTyping }
//   language-change { roomId, userId, language }
//
// Server → Client events:
//   room-state      — full snapshot sent to the joining user
//   user-joined     — broadcast when someone connects
//   user-left       — broadcast when someone disconnects
//   code-update     — another user's code changed
//   cursor-update   — another user's cursor moved
//   typing-update   — another user's typing status
//   language-update — another user switched language
//   new-submission  — someone submitted (also sent from REST handler)
//   room-started    — competition started
//   room-ended      — competition ended

// In-memory map: roomId → Map<userId, participantState>
const roomStates = new Map();

const STARTER_CODE = {
  python: `# Write your solution here\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()\n`,
  java:   `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n`,
  cpp:    `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  javascript: `// Write your solution here\nconst lines = [];\nprocess.stdin.on('line', l => lines.push(l));\nprocess.stdin.on('close', () => {\n    // process lines\n});\n`,
};

function setupSocket(io, prisma) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── join-room ─────────────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId, userId, displayName }) => {
      if (!roomId || !userId || !displayName) return;

      try {
        const requestedRoomId = roomId;
        const normalizedCode = String(roomId).trim().toUpperCase();
        const room = await prisma.room.findFirst({
          where: {
            OR: [
              { id: requestedRoomId },
              { code: normalizedCode },
            ],
          },
          include: {
            participants: {
              include: { user: { select: { id: true, displayName: true } } },
            },
            submissions: {
              include: { user: { select: { id: true, displayName: true } } },
              orderBy: { submittedAt: 'asc' },
            },
          },
        });
        if (!room) { socket.emit('error', { message: 'Room not found' }); return; }

        roomId = room.id;
        socket.join(roomId);
        socket.data.roomId      = roomId;
        socket.data.userId      = userId;
        socket.data.displayName = displayName;

        // Initialise room state map on first connection
        if (!roomStates.has(roomId)) roomStates.set(roomId, new Map());
        const roomState = roomStates.get(roomId);

        // Preserve existing code/language if user reconnects
        const prev = roomState.get(userId);
        roomState.set(userId, {
          displayName,
          socketId: socket.id,
          code:     prev?.code     || STARTER_CODE.python,
          language: prev?.language || 'python',
          cursor:   null,
          isTyping: false,
        });

        // Send full room state to the joining socket only
        socket.emit('room-state', {
          roomId,
          status:    room.status,
          startedAt: room.startedAt,
          participants: Array.from(roomState.entries()).map(([uid, s]) => ({
            userId: uid,
            displayName: s.displayName,
            code:        s.code,
            language:    s.language,
            cursor:      s.cursor,
            isTyping:    s.isTyping,
          })),
          submissions: room.submissions.map((s, i) => ({
            rank:        i + 1,
            userId:      s.userId,
            displayName: s.user.displayName,
            language:    s.language,
            submittedAt: s.submittedAt,
          })),
        });

        // Notify others
        socket.to(roomId).emit('user-joined', {
          userId,
          displayName,
          code:     roomState.get(userId).code,
          language: roomState.get(userId).language,
        });

        console.log(`👥 ${displayName} joined room ${roomId}`);
      } catch (err) {
        console.error('join-room error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ── code-change ───────────────────────────────────────────────────────────
    socket.on('code-change', ({ roomId, userId, code }) => {
      roomStates.get(roomId)?.get(userId) &&
        (roomStates.get(roomId).get(userId).code = code);
      socket.to(roomId).emit('code-update', { userId, code });
    });

    // ── cursor-change ─────────────────────────────────────────────────────────
    socket.on('cursor-change', ({ roomId, userId, cursor }) => {
      roomStates.get(roomId)?.get(userId) &&
        (roomStates.get(roomId).get(userId).cursor = cursor);
      socket.to(roomId).emit('cursor-update', { userId, cursor });
    });

    // ── typing-status ─────────────────────────────────────────────────────────
    socket.on('typing-status', ({ roomId, userId, isTyping }) => {
      roomStates.get(roomId)?.get(userId) &&
        (roomStates.get(roomId).get(userId).isTyping = isTyping);
      socket.to(roomId).emit('typing-update', { userId, isTyping });
    });

    // ── language-change ───────────────────────────────────────────────────────
    socket.on('language-change', ({ roomId, userId, language }) => {
      const state = roomStates.get(roomId)?.get(userId);
      if (state) {
        state.language = language;
        state.code     = STARTER_CODE[language] || '';
      }
      socket.to(roomId).emit('language-update', {
        userId,
        language,
        code: STARTER_CODE[language] || '',
      });
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { roomId, userId, displayName } = socket.data;
      if (!roomId || !userId) return;

      const roomState = roomStates.get(roomId);
      if (roomState) {
        roomState.delete(userId);
        if (roomState.size === 0) roomStates.delete(roomId);
      }

      socket.to(roomId).emit('user-left', { userId, displayName });
      console.log(`👋 ${displayName} left room ${roomId}`);
    });
  });
}

module.exports = setupSocket;
