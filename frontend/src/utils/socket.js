import { io } from 'socket.io-client';

// Empty string → Vite proxy handles routing to localhost:3001
export const socket = io('', {
  autoConnect: false,        // connect manually when entering a room
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});