import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_ORIGIN, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
});

// Add connection event listeners for debugging
socket.on("connect", () => {
  console.log("🔌 Socket.IO connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket.IO disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket.IO connection error:", error);
});

export default socket;
