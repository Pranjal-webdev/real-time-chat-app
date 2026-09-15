import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    auth: {
        token: localStorage.getItem("token"),
    },
});

export default socket;