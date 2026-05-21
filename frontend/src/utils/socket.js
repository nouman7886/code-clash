import { io } from 'socket.io-client';

const BACKEND_URL =
  (import.meta.env.VITE_API_URL || 'https://code-clash-jkdd.onrender.com')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

export const socket = io(BACKEND_URL, {

  autoConnect: false,

  reconnectionAttempts: 5,

  reconnectionDelay: 1000,

  transports: ['websocket', 'polling'],

});
