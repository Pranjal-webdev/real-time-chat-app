import { io } from "socket.io-client";

const SOCKET_URL = "https://real-time-chat-app-backend-1qh4.onrender.com://real-time-chat-app-backend-1qh4.onrender.com";

const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    auth: {
        token: localStorage.getItem("token"),
    },
});

export default socket;