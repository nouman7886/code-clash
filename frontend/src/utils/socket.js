import { io } from 'socket.io-client';

// Local development:
// export const socket = io('', { autoConnect: false });

// Production (Vercel):
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://code-clash-jkdd.onrender.com';

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});