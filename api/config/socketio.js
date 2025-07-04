import { Server as SocketIoServer } from "socket.io";
import { CLIENT_BASE_URL } from "../utils/env.js";

let io;

// Store active connections and rooms
const activeUsers = new Map(); // userId -> socketId
const courseRooms = new Map(); // courseId -> Set of userIds
const socketToUser = new Map(); // socketId -> userId

// Initialize and configure Socket.IO server
export const initSocketIo = (server) => {
  io = new SocketIoServer(server, {
    cors: {
      origin: CLIENT_BASE_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Handle user joining their personal room (for notifications)
    socket.on("join", (userId) => {
      socket.join(userId);
      activeUsers.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      console.log(`📦 User ${userId} joined their personal room`);
    });

    // Handle joining a course room for chat
    socket.on("join_course", ({ courseId, userId }) => {
      const courseRoom = `course_${courseId}`;

      // Join the course room
      socket.join(courseRoom);

      // Track course participants
      if (!courseRooms.has(courseId)) {
        courseRooms.set(courseId, new Set());
      }
      courseRooms.get(courseId).add(userId);

      const participantCount = courseRooms.get(courseId).size;
      console.log(
        `📦 User ${userId} joined course ${courseId} (${participantCount} participants)`
      );

      // Notify successful join
      socket.emit("joined_course", { courseId, participantCount });
    });

    // Handle leaving a course room
    socket.on("leave_course", ({ courseId, userId }) => {
      const courseRoom = `course_${courseId}`;
      socket.leave(courseRoom);

      // Remove from course participants
      if (courseRooms.has(courseId)) {
        courseRooms.get(courseId).delete(userId);
        if (courseRooms.get(courseId).size === 0) {
          courseRooms.delete(courseId);
        }
      }

      console.log(`📤 User ${userId} left course ${courseId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);

      const userId = socketToUser.get(socket.id);
      if (userId) {
        activeUsers.delete(userId);
        socketToUser.delete(socket.id);

        // Remove from all course rooms
        for (const [courseId, participants] of courseRooms.entries()) {
          if (participants.has(userId)) {
            participants.delete(userId);
            if (participants.size === 0) {
              courseRooms.delete(courseId);
            }
          }
        }
      }
    });
  });

  return io;
};

export const getIo = () => io;
