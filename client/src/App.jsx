import { useEffect } from "react";
import socket from "./socket/socket";

function App() {
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);

            socket.emit("joinConversation", "6a7dc1ebf7d29fd73e49f500");
        });

        socket.on("newMessage", (message) => {
            console.log("New message received:", message);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
            socket.off("connect");
            socket.off("newMessage");
            socket.off("disconnect");
            socket.disconnect();
        };
    }, []);

    return <h1>Real-Time Chat App</h1>;
}

export default App;