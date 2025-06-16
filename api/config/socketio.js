import { Server as SocketIoServer } from 'socket.io';
import { CLIENT_BASE_URL } from '../utils/env.js';

let io;

// Initialize and configure Socket.IO server
export const initSocketIo = (server) => {
  io = new SocketIoServer(server, {
    cors: {
      origin: CLIENT_BASE_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`📦 User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIo = () => io;
