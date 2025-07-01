import { io } from "socket.io-client";

const socket = io(import.meta.VITE_API_ORIGIN, {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
