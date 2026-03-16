import { io } from "socket.io-client";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://whatsapp-backend-87dn.onrender.com";

export const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true
});